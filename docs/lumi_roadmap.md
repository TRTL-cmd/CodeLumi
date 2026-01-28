# Lumi Roadmap (Short Term)

Scope
- Improve self-learning safety, lock persona control to Lumi internals, and solidify KB hygiene.

Key milestones
- Persona control: single active tone enforced; renderer cannot change tone (settings locked).
- Staging dedupe: append-time dedupe implemented and unit-tested.
- Privacy: redaction script run; timestamped backups created.
- Curator flows: group review and apply with backups.

Next steps
- Privacy audit across persisted writes and packaged builds.
- Add CI unit tests for staging dedupe and KB redaction.
- Produce user-facing privacy statement and export controls.
