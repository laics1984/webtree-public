# Schema Block Rendering Spec

## Purpose
Define safe rendering rules for runtime schema nodes.

## Rules
- use explicit block registry
- unknown blocks must fail gracefully
- renderer should not crash whole page on unsupported nodes
- keep block props mapping deterministic
