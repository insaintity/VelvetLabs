# AI Prompts

AI planning must use server-side provider connectors and strict Zod validation. OpenAI structured outputs are one supported path, but Claude, OpenAI-compatible endpoints and local CLI tools should also be usable when their output can be normalized into the same schemas.

The album planner should create the complete album before individual track prompts. Track prompts should describe genre, lead instrument, supporting instruments, mood, texture, beginning, development, ending and the track role in the album.

Avoid named-artist imitation, contradictory instructions, repeated structures and repeated title vocabulary.
