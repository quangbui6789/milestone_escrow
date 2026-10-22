# MilestoneEscrow

Intelligent Contract escrow for freelance/creative work with subjective criteria on GenLayer.

## Description

This contract allows:
- Clients to create a milestone, deposit funds, and define criteria in natural language
- Freelancers to submit a deliverable URL
- The contract to fetch the content and use an LLM to evaluate quality
- Validators to reach consensus via the Equivalence Principle
- Automatic fund release if the work is approved

## Key Features

- Uses `gl.vm.run_nondet_unsafe` with a proper leader/validator pattern
- Validators independently re-execute the task and compare decision fields (`approved` + `score`)
- Clear state design with `TreeMap` + `@allow_storage` dataclass
- Supports value transfers (payable + emit_transfer)

## Deployed

- **Contract Address**: `0x55a9B18B2Cb25b86fc6aed3b27C6F077F5c798C0`
- **Studio**: https://studio.genlayer.com

## Usage

1. `create_milestone(freelancer, criteria)` — Client creates a milestone and deposits funds
2. `submit_deliverable(milestone_id, url)` — Freelancer submits the work URL
3. `resolve(milestone_id)` — Anyone can call this to evaluate and release funds
4. `get_milestone(milestone_id)` — Retrieve milestone information

## Code

See [`milestone_escrow.py`](./milestone_escrow.py)
