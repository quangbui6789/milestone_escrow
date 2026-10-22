# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
from dataclasses import dataclass

@allow_storage
@dataclass
class Milestone:
    client: Address
    freelancer: Address
    amount: u256
    criteria: str
    deliverable_url: str
    status: str
    score: u32
    reasoning: str

class MilestoneEscrow(gl.Contract):
    milestones: TreeMap[str, Milestone]
    next_id: u32

    def __init__(self):
        self.next_id = u32(1)

    @gl.public.write.payable
    def create_milestone(self, freelancer: str, criteria: str) -> str:
        if gl.message.value == 0:
            raise gl.vm.UserError("Must deposit funds")
        if not criteria:
            raise gl.vm.UserError("Criteria required")

        mid = str(self.next_id)
        self.next_id += u32(1)

        self.milestones[mid] = Milestone(
            client=gl.message.sender_address,
            freelancer=Address(freelancer),
            amount=gl.message.value,
            criteria=criteria,
            deliverable_url="",
            status="open",
            score=u32(0),
            reasoning=""
        )
        return mid

    @gl.public.write
    def submit_deliverable(self, milestone_id: str, url: str):
        m = self.milestones.get(milestone_id)
        if m is None:
            raise gl.vm.UserError("Milestone not found")
        if gl.message.sender_address != m.freelancer:
            raise gl.vm.UserError("Not the freelancer")
        if m.status != "open":
            raise gl.vm.UserError("Not in open status")

        m.deliverable_url = url
        m.status = "submitted"
        self.milestones[milestone_id] = m

    @gl.public.write
    def resolve(self, milestone_id: str):
        m = self.milestones.get(milestone_id)
        if m is None or m.status != "submitted":
            raise gl.vm.UserError("Cannot resolve")

        def leader_fn():
            response = gl.nondet.web.get(m.deliverable_url)
            content = response.body.decode("utf-8")[:8000]

            prompt = f"""
You are a professional freelance work evaluator.
Client criteria: {m.criteria}
Deliverable content:
{content}

Evaluate whether the work meets the criteria.
Return JSON in this exact format:
{{
  "approved": true or false,
  "score": integer from 0 to 10,
  "reasoning": "brief explanation"
}}
"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.loads(raw)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                my_result = leader_fn()
                leader_data = leader_result.calldata
                same_approved = leader_data["approved"] == my_result["approved"]
                score_ok = abs(int(leader_data["score"]) - int(my_result["score"])) <= 1
                return same_approved and score_ok
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        m.score = u32(int(result["score"]))
        m.reasoning = result["reasoning"][:500]
        m.status = "approved" if result["approved"] else "rejected"
        self.milestones[milestone_id] = m

        if result["approved"]:
            gl.message.emit_transfer(
                to=m.freelancer,
                value=m.amount,
                on="finalized"
            )

    @gl.public.view
    def get_milestone(self, milestone_id: str):
        return self.milestones.get(milestone_id)
