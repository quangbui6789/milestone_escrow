# MilestoneEscrow

Intelligent Contract escrow cho công việc freelance/creative có tiêu chí chủ quan trên GenLayer.

## Mô tả

Contract cho phép:
- Client tạo milestone, nạp tiền và ghi tiêu chí bằng ngôn ngữ tự nhiên
- Freelancer nộp link deliverable
- Contract tự fetch nội dung, dùng LLM đánh giá chất lượng
- Validators đồng thuận theo Equivalence Principle
- Tự động giải ngân nếu được approved

## Tính năng chính

- Sử dụng `gl.vm.run_nondet_unsafe` với leader/validator pattern
- Validator tự thực hiện lại task rồi so sánh field quyết định (`approved` + `score`)
- State design rõ ràng với `TreeMap` + `@allow_storage` dataclass
- Hỗ trợ thanh toán (payable + emit_transfer)

## Deployed

- **Contract Address**: `0x55a9B18B2Cb25b86fc6aed3b27C6F077F5c798C0`
- **Studio**: https://studio.genlayer.com

## Cách sử dụng

1. `create_milestone(freelancer, criteria)` — Client tạo mốc và nạp tiền
2. `submit_deliverable(milestone_id, url)` — Freelancer nộp link công việc
3. `resolve(milestone_id)` — Bất kỳ ai cũng có thể gọi để đánh giá và giải ngân
4. `get_milestone(milestone_id)` — Xem thông tin mốc

## Code

Xem file [`milestone_escrow.py`](./milestone_escrow.py)
