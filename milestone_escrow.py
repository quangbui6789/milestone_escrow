# v0.1.0
# { "Depends": "py-genlayer:test" }

from genlayer import *
import typing
import json

@allow_storage
@dataclass
class Milestone:
    client: Address
    freelancer: Address
    amount: u256
    criteria: str
    deliverable_url: str
    status: str  # open, submitted, approved, rejected, refunded
    score: u32
    reasoning: str
    approved: bool

class MilestoneEscrow(gl.Contract):
    milestones: TreeMap[str, Milestone]
    next_id: u32

    def __init__(self):
        self.next_id = u32(1)

    @gl.public.payable
    def create_milestone(self, freelancer: str, criteria: str) -> str:
        if gl.message.value == 0:
            raise gl.vm.UserError("Must send GEN")
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
            reasoning="",
            approved=False,
        )
        return mid

    @gl.public.write
    def submit_deliverable(self, milestone_id: str, deliverable_url: str):
        m = self.milestones.get(milestone_id)
        if m is None:
            raise gl.vm.UserError("Milestone not found")
        if gl.message.sender_address != m.freelancer:
            raise gl.vm.UserError("Only freelancer can submit")
        if m.status != "open":
            raise gl.vm.UserError("Invalid status")

        m.deliverable_url = deliverable_url
        m.status = "submitted"

    @gl.public.write
    def resolve(self, milestone_id: str):
        m = self.milestones.get(milestone_id)
        if m is None:
            raise gl.vm.UserError("Milestone not found")
        if m.status != "submitted":
            raise gl.vm.UserError("Must be submitted first")

        def leader_fn():
            prompt = f"""
You are evaluating a freelance deliverable.

Criteria: {m.criteria}
Deliverable URL: {m.deliverable_url}

Return ONLY a valid JSON object with exactly these fields:
{{
  "approved": true or false,
  "score": integer between 0 and 10,
  "reasoning": "short explanation"
}}
"""
            result = gl.nondet.exec_prompt(prompt)
            return result

        def validator_fn(leader_result):
            try:
                data = json.loads(leader_result)
                approved = bool(data.get("approved"))
                score = int(data.get("score", 0))
                reasoning = str(data.get("reasoning", ""))

                if not (0 <= score <= 10):
                    return False
                if not reasoning:
                    return False
                return True
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        try:
            data = json.loads(result)
            approved = bool(data.get("approved"))
            score = int(data.get("score", 0))
            reasoning = str(data.get("reasoning", ""))

            # Validate again before storing
            if not (0 <= score <= 10):
                raise gl.vm.UserError("Invalid score")
            if not isinstance(approved, bool):
                raise gl.vm.UserError("Invalid approved")

            m.approved = approved
            m.score = u32(score)
            m.reasoning = reasoning
            m.status = "approved" if approved else "rejected"

            if approved:
                gl.message.emit_transfer(
                    to=m.freelancer,
                    value=m.amount,
                    on="finalized"
                )
        except Exception as e:
            raise gl.vm.UserError(f"Failed to parse result: {str(e)}")

    @gl.public.write
    def refund(self, milestone_id: str):
        """Client can refund if rejected or still open (cancel)."""
        m = self.milestones.get(milestone_id)
        if m is None:
            raise gl.vm.UserError("Milestone not found")
        if gl.message.sender_address != m.client:
            raise gl.vm.UserError("Only client can refund")
        if m.status not in ("open", "rejected"):
            raise gl.vm.UserError("Cannot refund in current status")

        m.status = "refunded"
        gl.message.emit_transfer(
            to=m.client,
            value=m.amount,
            on="finalized"
        )

    @gl.public.view
    def get_milestone(self, milestone_id: str):
        return self.milestones.get(milestone_id)
