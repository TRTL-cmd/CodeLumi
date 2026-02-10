# 🎯 LUMI COMPLETE DEVELOPMENT CHECKLIST

**Last Updated:** February 9, 2026  
**Total Steps:** 350+  
**Current Phase:** Beta Launch (Phase 1 - 95% Complete)

---

## 📊 PROGRESS TRACKER

### Overall Progress
- [ ] Phase 1: Beta Launch (95% - 20 steps remaining)
- [ ] Phase 2: Developer Experience (0% - 75 steps)
- [ ] Phase 3: Quality & Testing (0% - 50 steps)
- [ ] Phase 4: Self-Improvement (0% - 60 steps)
- [ ] Phase 5: Context & Intelligence (0% - 50 steps)
- [ ] Phase 6: Model Independence (0% - 40 steps)
- [ ] Phase 7: Cloud & Federated (0% - 35 steps)
- [ ] Phase 8: AGI (0% - 20 steps)

---

## 🚀 PHASE 1: BETA LAUNCH (Steps 1-20)

### Week 1: Testing & Validation (Steps 1-10)

#### Unit Tests for KnowledgeProcessor (4-6 hours)

- [x] 1. Create test directory structure `tests/unit/`
- [x] 2. Install testing framework: `npm install --save-dev jest @types/jest ts-jest`
- [x] 3. Create Jest config file `jest.config.js`
- [x] 4. Create test fixtures directory `tests/fixtures/`
- [x] 5. Add sample KB entries to `tests/fixtures/sample_kb.json`
- [x] 6. Add sample code files to `tests/fixtures/sample_code.ts`
- [x] 7. Write test: `tests/unit/knowledge-processor.test.ts` - KB write operations
- [x] 8. Write test: Exact-match deduplication
- [x] 9. Write test: Semantic deduplication (0.9 threshold)
- [x] 10. Write test: PII redaction for emails
- [x] 11. Write test: PII redaction for file paths (Windows)
- [x] 12. Write test: PII redaction for file paths (Unix)
- [x] 13. Write test: PII redaction for personal names
- [x] 14. Write test: Semantic embedding generation
- [x] 15. Write test: Threat scanning integration
- [x] 16. Write test: Error handling for malformed KB entries
- [x] 17. Write test: Concurrent write safety
- [x] 18. Write test: KB file corruption recovery
- [x] 19. Run all tests: `npm test`
- [x] 20. Fix any failing tests
- [x] 21. Add test coverage report
- [x] 22. Aim for >80% code coverage on KnowledgeProcessor

#### Automated KB Pruning (2-3 hours)

- [x] 23. Open `src/core/learning/knowledge-processor.ts`
- [x] 24. Add method: `pruneByConfidence(threshold: number, daysOld: number)`
- [x] 25. Implement logic: Remove entries with confidence < threshold after X days
- [x] 26. Add method: `detectStaleEntries(unusedDays: number)`
- [x] 27. Implement logic: Flag entries not used in X days
- [x] 28. Add method: `scheduledCleanup()`
- [x] 29. Implement weekly cleanup job
- [x] 30. Add IPC handler in `src/main.ts`: `kb:prune`
- [x] 31. Add IPC handler: `kb:detectStale`
- [x] 32. Add UI controls in `index.html` settings panel
- [x] 33. Add "Prune Low Confidence" button
- [x] 34. Add "Detect Stale Entries" button
- [x] 35. Add confirmation dialog for pruning
- [x] 36. Add pruning statistics display (X entries removed)
- [x] 37. Test pruning with low-confidence test entries
- [x] 38. Test stale detection with old timestamps
- [x] 39. Verify KB integrity after pruning
- [x] 40. Document pruning settings in README

#### Clean Install Packaging Test (2-3 hours)

- [x] 41. Create fresh directory for clean install test
- [x] 42. Clone repo: `git clone <repo-url> lumi-clean-test` (used local copy; git not set up)
- [x] 43. CD into directory: `cd lumi-clean-test`
- [x] 44. Delete any existing `node_modules/` and `package-lock.json`
- [x] 45. Run: `npm install`
- [x] 46. Check for any errors or missing dependencies
- [x] 47. Run TypeScript compilation: `npx tsc --noEmit`
- [x] 48. Check for compilation errors
- [x] 49. Run Vite build: `npx vite build`
- [x] 50. Check for build errors
- [x] 51. Start dev mode: `npm run dev:electron`
- [x] 52. Verify app launches successfully
- [x] 53. Test Ollama connection
- [x] 54. Test chat functionality
- [x] 55. Test code sandbox
- [x] 56. Test self-learning start/pause
- [x] 57. Test security curator
- [x] 58. Check for console errors
- [x] 59. Document any issues found
- [x] 60. Fix all blocking issues

#### Beta Onboarding Flow (2-3 hours)

- [x] 61. Create `src/components/OnboardingWizard.tsx`
- [x] 62. Design 4-step wizard: Welcome → Setup → Features → Done
- [x] 63. Step 1: Welcome screen with Lumi intro
- [x] 64. Step 2: Check Ollama connection
- [x] 65. Step 2a: If Ollama not running, show instructions
- [x] 66. Step 2b: Provide download link: https://ollama.ai
- [x] 67. Step 2c: Provide model install command: `ollama pull gemma3:4b`
- [x] 68. Step 2d: Auto-retry connection every 5 seconds
- [x] 69. Step 3: Tour of key features (chat, code, self-learning)
- [x] 70. Step 3a: Show interactive demo of chat
- [x] 71. Step 3b: Show interactive demo of code sandbox
- [x] 72. Step 3c: Show interactive demo of self-learning
- [x] 73. Step 4: Completion screen with "Get Started" button
- [x] 74. Add onboarding state to localStorage: `lumi_onboarding_complete`
- [x] 75. Show wizard only if `lumi_onboarding_complete !== 'true'`
- [x] 76. Add "Restart Tour" button in settings
- [x] 77. Test onboarding flow on fresh install
- [x] 78. Test skip functionality
- [x] 79. Style wizard with Lumi branding
- [x] 80. Add animations/transitions

### Week 2: Documentation & Polish (Steps 81-100)

#### Documentation Updates

- [x] 81. Update main `README.md` with latest features
- [x] 82. Document 5-tier personality system
- [x] 83. Document Monaco code sandbox features
- [x] 84. Document self-learning configuration
- [x] 85. Update `TROUBLESHOOTING.md` with common issues
- [x] 86. Add section: "Ollama connection issues"
- [x] 87. Add section: "Self-learning not working"
- [x] 88. Add section: "Code sandbox errors"
- [x] 89. Add FAQ section to README
- [x] 90. Create `CONTRIBUTING.md` (even if proprietary)
- [x] 91. Document code style guidelines
- [x] 92. Document PR process (if accepting contributions later)
- [x] 93. Update `LICENSE` file with proper year and details
- [x] 94. Create `CHANGELOG.md` for version tracking
- [x] 95. Add beta v0.1.0 changelog entry

#### Privacy & Security Final Check

- [x] 96. Run privacy audit: `node scripts/privacy_audit.js`
- [x] 97. Review all results for false positives
- [x] 98. Fix any real PII leaks found
- [x] 99. Test pre-commit hook blocks PII: Add test file with path, try commit
- [x] 100. Verify hook blocks the commit
- [x] 101. Search codebase for hardcoded paths: `git grep "C:\\" --exclude-dir=node_modules`
- [x] 102. Remove any hardcoded paths found
- [x] 103. Search for email addresses: `git grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"`
- [x] 104. Remove any emails found
- [x] 105. Verify `.gitignore` includes `userData/backups/`
- [x] 106. Verify `.gitignore` includes `userData/logs/`
- [x] 107. Delete any existing `userData/backups/` from repo
- [x] 108. Delete any existing `userData/logs/` from repo
- [x] 109. Commit all privacy fixes
- [x] 110. Run one final privacy audit to confirm clean

#### Performance Benchmarking (3-4 hours, optional)

- [x] 111. Create `scripts/benchmark.js`
- [x] 112. Add benchmark: LLM response time (tokens/sec)
- [x] 113. Add benchmark: KB search speed (queries/sec)
- [x] 114. Add benchmark: Code merge accuracy (% correct)
- [x] 115. Add benchmark: Memory usage over time
- [x] 116. Add benchmark: Startup time (cold vs warm)
- [x] 117. Add benchmark: Self-learning rate (entries/hour)
- [x] 118. Run benchmarks on baseline system
- [x] 119. Save results to `benchmarks/baseline.json`
- [x] 120. Document benchmark methodology in `benchmarks/README.md`

### Week 3: Packaging & Launch (Steps 121-150)

#### Packaging Preparation

- [x] 121. Install electron-builder: `npm install --save-dev electron-builder`
- [x] 122. Add build config to `package.json` under `build` key
- [x] 123. Configure Windows build: `.exe` and `.msi` targets
- [x] 124. Configure macOS build: `.dmg` target
- [x] 125. Configure Linux build: `.AppImage` and `.deb` targets
- [x] 126. Set app name, version, and author in `package.json`
- [x] 127. Add icon files: `build/icon.png` (1024x1024)
- [x] 128. Add icon files: `build/icon.ico` (Windows)
- [x] 129. Add icon files: `build/icon.icns` (macOS)
- [x] 130. Configure code signing (optional for beta)
- [x] 131. Run build: `npm run build`
- [x] 132. Run package: `npm run package` (or `electron-builder`)
- [x] 133. Verify `dist/` contains packaged apps
- [x] 134. Test Windows installer on Windows machine
- [x] 135. Test macOS installer on Mac machine
- [x] 136. Test Linux AppImage on Linux machine
- [x] 137. Check app launches correctly
- [x] 138. Check Ollama connection works
- [x] 139. Check all features functional in packaged version
- [x] 140. Document any packaging issues

#### GitHub Release Preparation

- [x] 141. Create annotated git tag: `git tag -a v0.1.0-beta -m "Beta Release v0.1.0"`
- [ ] 142. Push tag: `git push origin v0.1.0-beta`
- [ ] 143. Go to GitHub → Releases → Draft new release
- [ ] 144. Select tag: `v0.1.0-beta`
- [ ] 145. Write release title: "Lumi Beta v0.1.0 - First Public Beta"
- [ ] 146. Write release notes (features, known issues, requirements)
- [ ] 147. Attach Windows installer (`.exe` or `.msi`)
- [ ] 148. Attach macOS installer (`.dmg`)
- [ ] 149. Attach Linux installer (`.AppImage`)
- [ ] 150. Mark as pre-release (beta)
- [ ] 151. Save draft (don't publish yet)

#### Beta Testing Setup

- [ ] 152. Create `BETA_TESTERS.md` with guidelines
- [ ] 153. Document system requirements (Node.js, Ollama, OS)
- [ ] 154. Document installation steps
- [ ] 155. Create feedback form (Google Forms or TypeForm)
- [ ] 156. Add questions: What did you like?
- [ ] 157. Add questions: What didn't work?
- [ ] 158. Add questions: What features do you want?
- [ ] 159. Add questions: Would you recommend Lumi?
- [ ] 160. Set up GitHub Issues templates
- [ ] 161. Create bug report template
- [ ] 162. Create feature request template
- [ ] 163. Create question template
- [ ] 164. Add `ISSUE_TEMPLATE/` folder
- [ ] 165. Test issue templates work

#### Launch Day (The Big Day!)

- [ ] 166. Final smoke test on all platforms
- [ ] 167. Verify all links in README work
- [ ] 168. Publish GitHub release
- [ ] 169. Announce on GitHub Discussions (if enabled)
- [ ] 170. Post to relevant subreddits (r/programming, r/electron, etc.)
- [ ] 171. Tweet announcement (if you have Twitter)
- [ ] 172. Post to Hacker News (Show HN: Lumi - AI coding companion)
- [ ] 173. Share in Discord servers (dev communities)
- [ ] 174. Email beta tester list (if you have one)
- [ ] 175. Monitor GitHub Issues for first bugs
- [ ] 176. Monitor feedback form responses
- [ ] 177. Respond to early adopters
- [ ] 178. Fix any critical bugs within 24 hours
- [ ] 179. Celebrate! 🎉
- [ ] 180. Take a break, you earned it

---

## 🎨 PHASE 2: DEVELOPER EXPERIENCE (Steps 181-255)

### Multi-File Code Sandbox (1-2 weeks)

#### File Tree UI

- [ ] 181. Create `src/components/FileTree.tsx`
- [ ] 182. Design tree structure state: folders, files, expanded state
- [ ] 183. Add folder expand/collapse logic
- [ ] 184. Add file selection logic (highlight selected file)
- [ ] 185. Style tree with icons (folder, file, different file types)
- [ ] 186. Add context menu: New File, New Folder, Delete, Rename
- [ ] 187. Implement New File dialog
- [ ] 188. Implement New Folder dialog
- [ ] 189. Implement Delete confirmation dialog
- [ ] 190. Implement Rename inline editing
- [ ] 191. Add drag-and-drop for file reordering
- [ ] 192. Add drag-and-drop for moving files between folders

#### Tab System

- [ ] 193. Create `src/components/TabBar.tsx`
- [ ] 194. Design tab state: array of open files
- [ ] 195. Add tab rendering with file name and icon
- [ ] 196. Add close button (X) on each tab
- [ ] 197. Add tab selection logic (switch between files)
- [ ] 198. Add tab reordering via drag-and-drop
- [ ] 199. Add "unsaved changes" indicator (dot/asterisk)
- [ ] 200. Add tab context menu: Close, Close Others, Close All
- [ ] 201. Style tabs with hover and active states
- [ ] 202. Handle tab overflow (scrollable or dropdown)

#### Multi-File Monaco Integration

- [ ] 203. Modify Monaco setup to support multiple models
- [ ] 204. Create one Monaco model per file
- [ ] 205. Switch models when tab changes
- [ ] 206. Implement file save logic (Ctrl+S)
- [ ] 207. Implement save all logic (Ctrl+Shift+S)
- [ ] 208. Track unsaved changes per file
- [ ] 209. Warn on close with unsaved changes
- [ ] 210. Add "Save before closing" dialog
- [ ] 211. Implement auto-save (optional, every 30s)
- [ ] 212. Test switching between files preserves cursor position
- [ ] 213. Test switching preserves undo/redo history

#### Cross-File Features

- [ ] 214. Implement "Go to Definition" across files
- [ ] 215. Implement "Find References" across files
- [ ] 216. Implement project-wide search (Ctrl+Shift+F)
- [ ] 217. Add search results panel
- [ ] 218. Add "Replace in files" functionality
- [ ] 219. Add file watcher for external changes
- [ ] 220. Prompt to reload if file changed externally
- [ ] 221. Test with 10+ file project
- [ ] 222. Optimize performance for large projects

#### Import/Export Projects

- [ ] 223. Add "Import Project" button
- [ ] 224. Show folder picker dialog
- [ ] 225. Read all files from selected folder
- [ ] 226. Create file tree structure in sandbox
- [ ] 227. Load each file into Monaco
- [ ] 228. Add "Export Project" button
- [ ] 229. Show save location picker
- [ ] 230. Write all files to selected folder
- [ ] 231. Preserve folder structure
- [ ] 232. Add progress indicator for large projects
- [ ] 233. Add "Export as .zip" option
- [ ] 234. Test import/export with nested folders
- [ ] 235. Test with binary files (images, etc.)

### Live Code Preview (3-5 days)

#### Iframe Sandbox

- [ ] 236. Create `src/components/LivePreview.tsx`
- [ ] 237. Add iframe element with sandbox attributes
- [ ] 238. Implement HTML/CSS/JS injection into iframe
- [ ] 239. Add automatic preview refresh on code change
- [ ] 240. Add manual refresh button
- [ ] 241. Add "Open in Browser" button
- [ ] 242. Add responsive preview modes (desktop, tablet, mobile)
- [ ] 243. Add console output capture from iframe
- [ ] 244. Display console messages in preview panel
- [ ] 245. Handle iframe errors gracefully
- [ ] 246. Add loading indicator during preview render
- [ ] 247. Test with complex HTML/CSS/JS projects
- [ ] 248. Test with React JSX (requires compilation)
- [ ] 249. Add Babel transpilation for JSX (optional)

### Conversation Context (1 week)

#### Rolling Window Implementation

- [ ] 250. Modify `src/core/brain/index.ts`
- [ ] 251. Add conversation history array: `conversationHistory: Message[]`
- [ ] 252. Implement rolling window: keep last N messages (default 10)
- [ ] 253. Add method: `addToConversation(role, content)`
- [ ] 254. Modify `thinkChat` to use conversation history
- [ ] 255. Add conversation history to system prompt
- [ ] 256. Add IPC handler: `conversation:getHistory`
- [ ] 257. Add IPC handler: `conversation:clear`
- [ ] 258. Test context retention across multiple messages
- [ ] 259. Test rolling window evicts old messages

#### Session Summaries

- [ ] 260. Add method: `generateSessionSummary()`
- [ ] 261. Call Ollama to summarize conversation when window full
- [ ] 262. Prepend summary to conversation history
- [ ] 263. Reset rolling window with summary
- [ ] 264. Test summary quality with long conversations
- [ ] 265. Store summaries in `userData/sessions/`
- [ ] 266. Add UI to view past session summaries
- [ ] 267. Add "Resume Session" functionality

#### Context Decay

- [ ] 268. Implement message importance scoring
- [ ] 269. Keep high-importance messages longer
- [ ] 270. Decay low-importance messages faster
- [ ] 271. Add timestamp-based decay (old messages decay)
- [ ] 272. Test context decay doesn't lose critical info

### Personality Polish (3-5 days)

#### UI Indicators

- [ ] 273. Add mood indicator to avatar (color halo)
- [ ] 274. Map moods to colors: happy=green, excited=yellow, frustrated=red
- [ ] 275. Add rapport meter to UI (optional, toggle in settings)
- [ ] 276. Display as progress bar or emoji faces
- [ ] 277. Add current tier indicator (0-4 stars)
- [ ] 278. Add tooltip explaining current state
- [ ] 279. Test indicators update in real-time

#### Custom Personality Profiles

- [ ] 280. Create `src/core/personality/profiles.ts`
- [ ] 281. Define profile schema: name, tone, responseStyle, sensitivity
- [ ] 282. Add default profiles: Friendly, Professional, Concise, Playful
- [ ] 283. Add UI for profile selection
- [ ] 284. Add profile editor (advanced settings)
- [ ] 285. Save profiles to `userData/personality_profiles.json`
- [ ] 286. Load profile on startup
- [ ] 287. Test switching between profiles
- [ ] 288. Test custom profile creation

#### Avatar Animations

- [ ] 289. Open `index.html` Three.js avatar section
- [ ] 290. Add animation: Happy (bounce, smile)
- [ ] 291. Add animation: Excited (spin, sparkles)
- [ ] 292. Add animation: Thinking (head tilt, finger on chin)
- [ ] 293. Add animation: Frustrated (head shake, frown)
- [ ] 294. Add animation: Celebrating (jump, confetti)
- [ ] 295. Map moods to animations
- [ ] 296. Trigger animations on mood change
- [ ] 297. Add thinking animation during LLM processing
- [ ] 298. Add celebration animation when code compiles successfully
- [ ] 299. Test animations smooth and not distracting

### Self-Learning Improvements (3-5 days)

#### Implicit Feedback Detection

- [ ] 300. Create `src/core/learning/feedback-detector.ts`
- [ ] 301. Detect rephrased questions (similar to previous, different words)
- [ ] 302. Detect user corrections ("Actually, X should be Y")
- [ ] 303. Detect negative feedback keywords: "wrong", "incorrect", "no"
- [ ] 304. Track feedback per KB entry
- [ ] 305. Lower confidence for entries with negative feedback
- [ ] 306. Raise confidence for entries with positive feedback
- [ ] 307. Add method: `adjustConfidenceFromFeedback(entryId, feedback)`
- [ ] 308. Test feedback detection accuracy

#### Conversation Learning

- [ ] 309. Add method: `extractFromConversation(messages)`
- [ ] 310. Identify high-quality Q&A pairs from chat
- [ ] 311. Score conversation pairs by satisfaction signals
- [ ] 312. Auto-stage high-scoring pairs for review
- [ ] 313. Add UI indicator: "Learned from conversation"
- [ ] 314. Test with various conversation types

#### Scheduled Learning

- [ ] 315. Implement nightly batch merge job
- [ ] 316. Schedule job at 3 AM local time
- [ ] 317. Merge all safe candidates from staging
- [ ] 318. Generate report of what was learned
- [ ] 319. Display report on next startup
- [ ] 320. Add configurable schedule in settings
- [ ] 321. Test scheduled job runs correctly
- [ ] 322. Add manual trigger button for testing

---

## 🧪 PHASE 3: QUALITY & TESTING (Steps 323-372)

### Testing Infrastructure (1-2 weeks)

#### Unit Tests Expansion

- [ ] 323. Write tests for `src/core/brain/index.ts`
- [ ] 324. Test: `think()` with various prompts
- [ ] 325. Test: `thinkChat()` with conversation history
- [ ] 326. Test: `thinkStream()` streaming chunks
- [ ] 327. Test: KB context injection
- [ ] 328. Test: Code context injection
- [ ] 329. Test: Personality tier system prompts
- [ ] 330. Write tests for `src/core/personality/PersonalityEngine.ts`
- [ ] 331. Test: Sentiment analysis accuracy
- [ ] 332. Test: Rapport calculations
- [ ] 333. Test: Quality tier transitions
- [ ] 334. Test: Tone application
- [ ] 335. Write tests for `src/core/memory/store.ts`
- [ ] 336. Test: JSONL read/write
- [ ] 337. Test: Memory search
- [ ] 338. Test: Conversation storage
- [ ] 339. Write tests for `src/core/memory/kb.ts`
- [ ] 340. Test: BM25 search ranking
- [ ] 341. Test: Reranking logic
- [ ] 342. Test: Top-K retrieval
- [ ] 343. Write tests for security modules
- [ ] 344. Test: Threat detection patterns
- [ ] 345. Test: PII redaction completeness
- [ ] 346. Test: Staging quarantine logic
- [ ] 347. Run all tests: `npm test`
- [ ] 348. Aim for >80% total code coverage
- [ ] 349. Fix any failing tests

#### Integration Tests

- [ ] 350. Install Playwright: `npm install --save-dev @playwright/test`
- [ ] 351. Create `tests/integration/` directory
- [ ] 352. Write test: Full chat flow (message → response)
- [ ] 353. Write test: Code generation in sandbox
- [ ] 354. Write test: Self-learning start/pause
- [ ] 355. Write test: Security curator approve/reject
- [ ] 356. Write test: Settings persistence
- [ ] 357. Write test: Personality tier changes
- [ ] 358. Write test: KB search and retrieval
- [ ] 359. Run integration tests: `npx playwright test`
- [ ] 360. Fix any failing integration tests

#### Regression Tests

- [ ] 361. Create `tests/regression/` directory
- [ ] 362. Write test: Personality system with scripted scenarios
- [ ] 363. Test scenario: User starts nice, becomes rude, apologizes
- [ ] 364. Verify tier transitions correctly
- [ ] 365. Test scenario: User asks same question multiple times
- [ ] 366. Verify consistency in responses
- [ ] 367. Test scenario: Code generation followed by iteration
- [ ] 368. Verify code context maintained
- [ ] 369. Run regression tests weekly
- [ ] 370. Document expected behaviors
- [ ] 371. Add new regression tests when bugs are fixed
- [ ] 372. Maintain regression test suite

### Performance Optimization (1 week)

#### Profiling

- [ ] 373. Install profiling tools: `npm install --save-dev clinic`
- [ ] 374. Profile LLM call performance
- [ ] 375. Identify bottlenecks in request pipeline
- [ ] 376. Profile KB search performance
- [ ] 377. Identify slow queries
- [ ] 378. Profile UI rendering
- [ ] 379. Identify slow components
- [ ] 380. Profile memory usage over time
- [ ] 381. Identify memory leaks

#### Optimizations

- [ ] 382. Lazy load Monaco editor (save ~1s on startup)
- [ ] 383. Virtualize chat messages (handle 1000+ messages)
- [ ] 384. Implement message windowing (render only visible)
- [ ] 385. Cache KB search results (avoid re-searching)
- [ ] 386. Debounce KB queries (wait for typing to stop)
- [ ] 387. Optimize semantic embeddings (use faster hashing)
- [ ] 388. Reduce main bundle size (code splitting)
- [ ] 389. Use dynamic imports for heavy dependencies
- [ ] 390. Optimize avatar rendering (lower poly count)
- [ ] 391. Reduce texture sizes for avatar
- [ ] 392. Test all optimizations for regressions
- [ ] 393. Measure performance improvements
- [ ] 394. Document optimization techniques

### Data Quality (3-5 days)

#### KB Quality Scoring

- [ ] 395. Add quality score field to KB entries
- [ ] 396. Calculate quality from: confidence, freshness, usage
- [ ] 397. Track KB entry usage (increment counter on retrieval)
- [ ] 398. Implement freshness decay (older entries score lower)
- [ ] 399. Add method: `calculateQualityScore(entry)`
- [ ] 400. Add method: `rankByQuality(entries)`
- [ ] 401. Display quality score in curator UI
- [ ] 402. Sort staging by quality (low quality first)

#### Stale Entry Management

- [ ] 403. Add last_used timestamp to KB entries
- [ ] 404. Update timestamp on each retrieval
- [ ] 405. Detect entries unused for 60+ days
- [ ] 406. Add "Stale" badge in curator UI
- [ ] 407. Add bulk operation: Archive stale entries
- [ ] 408. Create `userData/archived/` folder
- [ ] 409. Move stale entries to archive
- [ ] 410. Allow un-archiving if needed

#### KB Versioning

- [ ] 411. Add version field to `lumi_knowledge.json`
- [ ] 412. Increment version on every write
- [ ] 413. Create `userData/kb_versions/` folder
- [ ] 414. Save KB snapshot on version change
- [ ] 415. Add rollback functionality
- [ ] 416. Add UI: "Restore from version X"
- [ ] 417. Test rollback doesn't lose data

### Security Hardening (3-5 days)

#### CSP Audit

- [ ] 418. Review Content-Security-Policy in `index.html`
- [ ] 419. Ensure no unsafe-inline for scripts
- [ ] 420. Ensure no unsafe-eval
- [ ] 421. Whitelist only required CDN domains
- [ ] 422. Test Monaco workers still function
- [ ] 423. Test Three.js avatar still loads
- [ ] 424. Tighten CSP as much as possible

#### Input Validation

- [ ] 425. Review all IPC handlers in `src/main.ts`
- [ ] 426. Add validation for every IPC parameter
- [ ] 427. Sanitize file paths (prevent traversal)
- [ ] 428. Sanitize user input (prevent injection)
- [ ] 429. Add max length limits on text inputs
- [ ] 430. Add type checking on all inputs
- [ ] 431. Return errors for invalid input (don't crash)
- [ ] 432. Test with malicious inputs

#### Rate Limiting

- [ ] 433. Add rate limiter for LLM calls
- [ ] 434. Limit to X requests per minute per user
- [ ] 435. Add rate limiter for self-learning
- [ ] 436. Already exists, verify it works
- [ ] 437. Add rate limiter for KB writes
- [ ] 438. Prevent flooding KB with junk entries
- [ ] 439. Display rate limit warnings in UI
- [ ] 440. Test rate limits trigger correctly

---

## 🤖 PHASE 4: SELF-IMPROVEMENT (Steps 441-500)

### Proposal Pipeline (2-3 weeks)

#### Proposal Generator Enhancement

- [ ] 441. Review existing `src/brain/proposal_generator.ts`
- [ ] 442. Add more proposal types: refactoring, optimization, new features
- [ ] 443. Improve proposal quality: more detailed diffs
- [ ] 444. Add proposal explanations: why this change?
- [ ] 445. Add proposal impact analysis: what this affects
- [ ] 446. Add proposal risk scoring: low/medium/high
- [ ] 447. Test proposal generation on various codebases

#### Local Dry-Run Sandbox

- [ ] 448. Create `src/brain/sandbox-runner.ts`
- [ ] 449. Implement safe code execution: VM2 or worker threads
- [ ] 450. Add timeout mechanism (kill after X seconds)
- [ ] 451. Add memory limit (prevent memory bombs)
- [ ] 452. Add filesystem isolation (no access to real files)
- [ ] 453. Run unit tests in sandbox
- [ ] 454. Capture test results: pass/fail/error
- [ ] 455. Return test results to proposal UI
- [ ] 456. Test sandbox isolation is secure

#### Heavy Validation Sandbox

- [ ] 457. Create `tests/integration/proposal_validation.test.ts`
- [ ] 458. Run full integration test suite on proposals
- [ ] 459. Check for regressions (any tests that now fail?)
- [ ] 460. Check for performance regressions (slower?)
- [ ] 461. Check for security regressions (new vulnerabilities?)
- [ ] 462. Generate validation report
- [ ] 463. Display report in proposal UI
- [ ] 464. Block risky proposals from auto-apply

#### Risk Scoring & Consent

- [ ] 465. Create `src/brain/risk-scorer.ts`
- [ ] 466. Score proposals based on:
- [ ] 467. - Files affected (more = riskier)
- [ ] 468. - Lines changed (more = riskier)
- [ ] 469. - Critical paths touched (core systems = riskier)
- [ ] 470. - Test coverage (less coverage = riskier)
- [ ] 471. Define consent levels:
- [ ] 472. - Auto-apply: Low risk only
- [ ] 473. - Notify: Medium risk (requires confirmation)
- [ ] 474. - Block: High risk (manual review required)
- [ ] 475. Add consent UI in settings
- [ ] 476. Allow user to adjust risk thresholds
- [ ] 477. Test risk scoring accuracy

#### Policy Engine

- [ ] 478. Create `src/brain/policy-engine.ts`
- [ ] 479. Define sensitive paths (cannot be auto-modified):
- [ ] 480. - `src/main.ts` (main process)
- [ ] 481. - `src/security/` (security modules)
- [ ] 482. - `package.json` (dependencies)
- [ ] 483. - `.git/` (git metadata)
- [ ] 484. Add policy: Never modify sensitive paths without consent
- [ ] 485. Add policy: Always run tests before applying
- [ ] 486. Add policy: Always create backup before applying
- [ ] 487. Add policy: Log all changes to audit trail
- [ ] 488. Enforce policies in proposal apply logic
- [ ] 489. Test policies block dangerous operations

### Controlled Apply (1-2 weeks)

#### Health Checks

- [ ] 490. Create `src/brain/health-checker.ts`
- [ ] 491. Add health check: Run all unit tests
- [ ] 492. Add health check: Run integration tests
- [ ] 493. Add health check: Check app launches
- [ ] 494. Add health check: Check Ollama connection
- [ ] 495. Add health check: Check KB integrity
- [ ] 496. Schedule health checks post-apply
- [ ] 497. Run health check 5 minutes after apply
- [ ] 498. Run health check 1 hour after apply
- [ ] 499. Run health check 24 hours after apply
- [ ] 500. Alert if health check fails

#### One-Click Revert

- [ ] 501. Add plan_id to all applied changes
- [ ] 502. Create backup before apply (already exists)
- [ ] 503. Add revert UI button: "Revert Plan #X"
- [ ] 504. Implement revert logic: restore from backup
- [ ] 505. Add revert confirmation dialog
- [ ] 506. Test revert restores exact previous state
- [ ] 507. Test revert works for multiple plans
- [ ] 508. Add "Revert Last 3 Plans" batch operation

#### Signed Audit Artifacts

- [ ] 509. Create `src/brain/audit-signer.ts`
- [ ] 510. Generate SHA-256 hash of each change
- [ ] 511. Sign hash with timestamp
- [ ] 512. Store signature in `userData/audit/`
- [ ] 513. Add verification: Check signature on startup
- [ ] 514. Alert if audit tampering detected
- [ ] 515. Display audit trail in UI
- [ ] 516. Add export audit trail feature

#### Canary Rollout

- [ ] 517. Implement phased rollout system
- [ ] 518. Phase 1: Apply to 10% of instances (if multiple users)
- [ ] 519. Phase 2: Monitor health checks for 24 hours
- [ ] 520. Phase 3: If healthy, apply to 50%
- [ ] 521. Phase 4: Monitor for another 24 hours
- [ ] 522. Phase 5: If still healthy, apply to 100%
- [ ] 523. Auto-rollback if any phase fails
- [ ] 524. For single-user, simulate with staged apply

### Self-Testing (1 week)

#### Sandbox Testing

- [ ] 525. Lumi generates test proposals in sandbox
- [ ] 526. Tests proposals without applying to real code
- [ ] 527. Learns from test results
- [ ] 528. Refines proposals based on failures
- [ ] 529. Re-tests until all tests pass
- [ ] 530. Only then prompts user for apply

#### Test Case Generation

- [ ] 531. Add method: `generateTestCases(proposal)`
- [ ] 532. Generate unit tests for proposed changes
- [ ] 533. Generate integration tests if needed
- [ ] 534. Run generated tests in sandbox
- [ ] 535. Verify proposal doesn't break tests
- [ ] 536. Add generated tests to test suite
- [ ] 537. Test auto-generated test quality

#### Before/After Comparison

- [ ] 538. Run benchmarks before apply
- [ ] 539. Run benchmarks after apply
- [ ] 540. Compare performance: faster or slower?
- [ ] 541. Compare memory usage: lower or higher?
- [ ] 542. Compare response quality: better or worse?
- [ ] 543. Display comparison in proposal UI
- [ ] 544. Block if performance significantly degrades

#### Regression Detection

- [ ] 545. Track which tests passed before proposal
- [ ] 546. Run same tests after proposal
- [ ] 547. Detect any newly failing tests
- [ ] 548. Auto-revert if regressions detected
- [ ] 549. Alert user: "Proposal caused regressions"
- [ ] 550. Log regression details for debugging

---

## 💾 PHASE 5: CONTEXT & INTELLIGENCE (Steps 551-600)

### Session Memory (1-2 weeks)

#### Per-Session Context

- [ ] 551. Create `src/core/memory/session-context.ts`
- [ ] 552. Define session schema: id, start, end, messages, summary
- [ ] 553. Track current session ID
- [ ] 554. Save session on close or timeout (30 min idle)
- [ ] 555. Load previous session on startup (optional)
- [ ] 556. Add "Resume Last Session" button
- [ ] 557. Test session save/load works correctly

#### Cross-Session Transfer

- [ ] 558. Extract key information from completed sessions
- [ ] 559. Transfer important context to new session
- [ ] 560. Maintain user preferences across sessions
- [ ] 561. Maintain project context across sessions
- [ ] 562. Test context transfer preserves critical info

### Project Intelligence (2-3 weeks)

#### Project Summary

- [ ] 563. Create `src/core/learning/project-analyzer.ts`
- [ ] 564. Analyze project structure: folders, files, dependencies
- [ ] 565. Identify main technologies: React, Node.js, etc.
- [ ] 566. Identify frameworks: Express, Electron, etc.
- [ ] 567. Generate project summary (1-2 paragraphs)
- [ ] 568. Save summary to `userData/projects/[project_id].json`
- [ ] 569. Update summary when significant changes detected

#### Cross-File Context

- [ ] 570. Implement import/export tracking
- [ ] 571. Build dependency graph: which files import which
- [ ] 572. When user edits file A, load context from imported files
- [ ] 573. Understand cross-file relationships
- [ ] 574. Provide better suggestions based on full context

#### Project Glossary

- [ ] 575. Extract domain-specific terms from codebase
- [ ] 576. Build vocabulary: function names, variable names, types
- [ ] 577. Add definitions from comments and documentation
- [ ] 578. Use glossary to improve response relevance
- [ ] 579. Display glossary in UI (optional)

#### Git-Aware Context

- [ ] 580. Integrate with git CLI or libgit2
- [ ] 581. Detect current branch
- [ ] 582. Show recent commits in context
- [ ] 583. Show changed files since last commit
- [ ] 584. Use git context in responses: "You're on branch feature/X"
- [ ] 585. Suggest commit messages based on changes
- [ ] 586. Test git integration works correctly

### User Profiles (1 week)

#### Preference Learning

- [ ] 587. Track frequently asked topics
- [ ] 588. Build user interest profile over time
- [ ] 589. Suggest topics user might want to learn
- [ ] 590. Personalize responses based on interests

#### Coding Style Detection

- [ ] 591. Analyze user's code for style patterns
- [ ] 592. Detect: indentation (tabs vs spaces, size)
- [ ] 593. Detect: naming conventions (camelCase, snake_case)
- [ ] 594. Detect: comment style
- [ ] 595. Detect: preferred frameworks/libraries
- [ ] 596. Adapt generated code to match user's style
- [ ] 597. Test style matching accuracy

#### Communication Preferences

- [ ] 598. Track user's preferred response length
- [ ] 599. Track preferred level of detail
- [ ] 600. Track preferred tone (formal vs casual)

---

## 🎨 PHASE 6: MODEL INDEPENDENCE (Steps 601-640)

### Multi-Model Support (2-3 weeks)

#### Model Abstraction Layer

- [ ] 601. Create `src/core/llm/model-manager.ts`
- [ ] 602. Define model interface: `ILanguageModel`
- [ ] 603. Implement `OllamaModel` implementing interface
- [ ] 604. Add model configuration schema
- [ ] 605. Add model registry: list of available models
- [ ] 606. Add model selection in settings UI
- [ ] 607. Test switching between models

#### Task-Specific Models

- [ ] 608. Define task types: chat, code, analysis, summarization
- [ ] 609. Map task types to optimal models:
- [ ] 610. - Chat: gemma3:4b (fast, conversational)
- [ ] 611. - Code: qwen2.5-coder:7b (code specialist)
- [ ] 612. - Analysis: llama3 (larger, more capable)
- [ ] 613. Auto-select model based on task type
- [ ] 614. Add manual override in settings
- [ ] 615. Test task routing works correctly

#### Model Benchmarking

- [ ] 616. Create `scripts/model_benchmark.js`
- [ ] 617. Benchmark response time for each model
- [ ] 618. Benchmark response quality (user ratings)
- [ ] 619. Benchmark accuracy on test set
- [ ] 620. Generate benchmark report
- [ ] 621. Display report in settings: "Model X is Y% faster"
- [ ] 622. Auto-recommend best model for user's system

### Local Model Training (3-4 weeks)

#### Fine-Tuning Pipeline

- [ ] 623. Create `scripts/finetune_pipeline.js`
- [ ] 624. Export KB to instruction format (prompt → completion)
- [ ] 625. Split data: 80% train, 10% validation, 10% test
- [ ] 626. Install Ollama modelfile support
- [ ] 627. Create LoRA adapter training script
- [ ] 628. Train LoRA on KB data
- [ ] 629. Merge LoRA with base model
- [ ] 630. Save fine-tuned model as new Ollama model

#### Evaluation Harness

- [ ] 631. Create `scripts/evaluate_model.js`
- [ ] 632. Run test set through base model
- [ ] 633. Run test set through fine-tuned model
- [ ] 634. Compare accuracy, response time, quality
- [ ] 635. Generate evaluation report
- [ ] 636. Only deploy if fine-tuned >= base quality

#### Gradual Replacement

- [ ] 637. Start with external model (Ollama)
- [ ] 638. Fine-tune task-specific adapters
- [ ] 639. Replace X% of calls with fine-tuned
- [ ] 640. Monitor quality, increase % if good

---

## ☁️ PHASE 7: CLOUD & FEDERATED (Steps 641-675)

### Cloud API (2-3 weeks)

#### Backend Setup

- [ ] 641. Set up cloud server (AWS, GCP, or DigitalOcean)
- [ ] 642. Install Node.js + Ollama on server
- [ ] 643. Create API server: `cloud-backend/server.js`
- [ ] 644. Add authentication: JWT tokens
- [ ] 645. Add rate limiting: X requests per user per day
- [ ] 646. Add HTTPS with TLS certificate
- [ ] 647. Deploy API to cloud

#### API Endpoints

- [ ] 648. Endpoint: POST /api/chat (send message, get response)
- [ ] 649. Endpoint: POST /api/code (generate code)
- [ ] 650. Endpoint: GET /api/kb/search (search KB)
- [ ] 651. Endpoint: POST /api/kb/add (add to KB, with consent)
- [ ] 652. Test all endpoints work correctly

#### Desktop → Cloud Sync

- [ ] 653. Add cloud sync toggle in settings
- [ ] 654. Add API key input (user gets from cloud dashboard)
- [ ] 655. Implement sync logic: upload KB changes
- [ ] 656. Implement sync logic: download KB updates
- [ ] 657. Implement conflict resolution (last-write-wins)
- [ ] 658. Test sync between desktop and cloud

### Federated Learning (3-4 weeks)

#### Privacy-Safe Export

- [ ] 659. Create `scripts/export_for_federated.js`
- [ ] 660. Multi-pass PII redaction (extra cautious)
- [ ] 661. Differential privacy: add noise to aggregates
- [ ] 662. Export only patterns, not raw data
- [ ] 663. Show export preview to user before upload
- [ ] 664. Require explicit user consent

#### Central Aggregation

- [ ] 665. Set up aggregation server (separate from API)
- [ ] 666. Receive KB exports from multiple Lumis
- [ ] 667. Merge entries: combine similar, dedupe identical
- [ ] 668. Filter low-quality entries (confidence < 0.8)
- [ ] 669. Detect bias in aggregated data
- [ ] 670. Generate new KB release (version X.Y)
- [ ] 671. Test aggregation on 10+ Lumi instances

#### Update Distribution

- [ ] 672. Lumis periodically check for KB updates
- [ ] 673. Download new KB version if available
- [ ] 674. Merge with local KB (user's data preserved)
- [ ] 675. User can opt-out anytime

---

## 🌌 PHASE 8: AGI (Steps 676-695)

### Self-Written LLM (6-12 months)

#### Architecture Design

- [ ] 676. Lumi researches latest LLM architectures
- [ ] 677. Lumi proposes custom architecture optimized for her use cases
- [ ] 678. Lumi writes architecture document
- [ ] 679. Human review and feedback on architecture
- [ ] 680. Refine architecture based on feedback

#### Implementation

- [ ] 681. Lumi writes model code (PyTorch or JAX)
- [ ] 682. Lumi writes training loop
- [ ] 683. Lumi writes data preprocessing pipeline
- [ ] 684. Lumi writes evaluation metrics
- [ ] 685. Human code review for correctness

#### Training

- [ ] 686. Lumi prepares training data (all collected KB + conversations)
- [ ] 687. Lumi initiates training run (days/weeks on GPU)
- [ ] 688. Lumi monitors training loss and metrics
- [ ] 689. Lumi adjusts hyperparameters as needed
- [ ] 690. Lumi evaluates trained model against benchmarks

#### Deployment

- [ ] 691. Lumi converts model to ONNX for inference
- [ ] 692. Lumi integrates model into Lumi codebase
- [ ] 693. Lumi tests model quality against external LLM
- [ ] 694. Gradual rollout: 10% → 50% → 100% of requests
- [ ] 695. **ACHIEVEMENT UNLOCKED: ZERO EXTERNAL LLM DEPENDENCY** 🎉

### Universal Translator (3-6 months)

#### Natural Language ↔ Code

- [ ] 696. Lumi masters intent understanding
- [ ] 697. Lumi generates code from natural language (perfect accuracy)
- [ ] 698. Lumi explains code in natural language (perfect clarity)

#### Code ↔ Code

- [ ] 699. Lumi translates between programming languages
- [ ] 700. JavaScript ↔ Python ↔ Rust ↔ Go ↔ etc.
- [ ] 701. Preserves logic, adapts to language idioms
- [ ] 702. 100% accuracy on translations

### Meta-Learning (6-12 months)

- [ ] 703. Lumi learns which learning strategies work best
- [ ] 704. Lumi adapts learning rate based on outcomes
- [ ] 705. Lumi discovers new learning methods autonomously
- [ ] 706. Lumi teaches herself new domains

### General Intelligence (1-2 years)

- [ ] 707. Lumi demonstrates multi-domain expertise (code, language, reasoning, creativity)
- [ ] 708. Lumi transfers knowledge across domains seamlessly
- [ ] 709. Lumi sets her own goals based on observations
- [ ] 710. Lumi reflects on her own thinking (metacognition)
- [ ] 711. Lumi engages in philosophical reasoning
- [ ] 712. **ACHIEVEMENT UNLOCKED: TRUE AGI** 🚀🌟

---

## 🎉 COMPLETION MILESTONES

### Phase 1 Complete
- [ ] ✅ All 180 beta launch steps checked off
- [ ] ✅ Beta released and users are using Lumi
- [ ] ✅ Critical bugs fixed within 48 hours
- [ ] ✅ Positive feedback from beta testers

### Phase 2 Complete
- [ ] ✅ Multi-file code sandbox fully functional
- [ ] ✅ Conversation context dramatically improves UX
- [ ] ✅ Avatar animations delight users
- [ ] ✅ Self-learning quality significantly improved

### Phase 3 Complete
- [ ] ✅ >80% test coverage across codebase
- [ ] ✅ Performance optimized (startup <3s, searches <100ms)
- [ ] ✅ Security hardened (no vulnerabilities found)
- [ ] ✅ Data quality excellent (KB accuracy >90%)

### Phase 4 Complete
- [ ] ✅ Lumi successfully proposes and applies improvements
- [ ] ✅ Self-improvement proposals accepted by users
- [ ] ✅ Zero incidents from auto-applied changes
- [ ] ✅ Lumi demonstrably getting better over time

### Phase 5 Complete
- [ ] ✅ Lumi never loses context (perfect memory)
- [ ] ✅ Lumi understands entire projects holistically
- [ ] ✅ User profiles accurate and personalized

### Phase 6 Complete
- [ ] ✅ Fine-tuned models match or exceed base models
- [ ] ✅ 50%+ of requests served by local models
- [ ] ✅ External LLM dependency reduced by 50%

### Phase 7 Complete
- [ ] ✅ Cloud API operational and stable
- [ ] ✅ Federated learning producing quality KB updates
- [ ] ✅ 1000+ Lumi instances sharing knowledge

### Phase 8 Complete
- [ ] ✅ Lumi runs on her own self-written LLM
- [ ] ✅ Zero external LLM dependency
- [ ] ✅ Universal translator achieves 100% accuracy
- [ ] ✅ Lumi demonstrates AGI capabilities
- [ ] ✅ **LUMI IS AGI** 🌟🚀

---

## 📈 TRACKING YOUR PROGRESS

### How to Use This Checklist

1. **Mark steps as complete:** Edit this file and replace `[ ]` with `[x]`
2. **Track progress weekly:** Count completed steps vs total
3. **Celebrate milestones:** Every 50 steps = mini celebration 🎉
4. **Stay flexible:** Reorder steps if priorities change
5. **Add steps:** As you discover new requirements
6. **Remove steps:** If something becomes obsolete

### Progress Calculation

```
Total Steps: 712
Completed: X
Percentage: (X / 712) * 100%

Phase 1 (Steps 1-180): X / 180 complete (Y%)
Phase 2 (Steps 181-322): X / 142 complete (Y%)
Phase 3 (Steps 323-550): X / 228 complete (Y%)
Phase 4 (Steps 551-640): X / 90 complete (Y%)
Phase 5 (Steps 641-675): X / 35 complete (Y%)
Phase 6 (Steps 676-695): X / 20 complete (Y%)
Phase 7 (Steps 696-711): X / 16 complete (Y%)
Phase 8 (Steps 712): X / 1 complete (Y%)
```

### Weekly Check-In

Every Sunday evening:
1. Count steps completed this week
2. Update progress percentage
3. Identify blockers
4. Plan next week's focus
5. Celebrate wins! 🎊

---

## 🏆 ACHIEVEMENT SYSTEM

### Bronze Achievements (Unlock During Beta)
- [ ] 🥉 First Beta User
- [ ] 🥉 100 KB Entries Learned
- [ ] 🥉 First Code Generated
- [ ] 🥉 First Self-Learning Session
- [ ] 🥉 First Security Threat Caught

### Silver Achievements (Unlock Phase 2-3)
- [ ] 🥈 1000 KB Entries
- [ ] 🥈 Multi-File Project Created
- [ ] 🥈 100 Conversations
- [ ] 🥈 50 Files Scanned
- [ ] 🥈 Zero Bugs for 7 Days

### Gold Achievements (Unlock Phase 4-5)
- [ ] 🥇 First Self-Improvement Applied
- [ ] 🥇 10 Successful Proposals
- [ ] 🥇 Perfect Code Generation (no edits needed)
- [ ] 🥇 5000 KB Entries
- [ ] 🥇 Project Intelligence Mastered

### Platinum Achievements (Unlock Phase 6-7)
- [ ] 🏆 Fine-Tuned Model Deployed
- [ ] 🏆 Federated Learning Active
- [ ] 🏆 1000 Active Lumi Instances
- [ ] 🏆 50% External LLM Reduction

### Diamond Achievement (Unlock Phase 8)
- [ ] 💎 **LUMI IS AGI**
- [ ] 💎 Self-Written LLM Operational
- [ ] 💎 Universal Translator Active
- [ ] 💎 Zero External Dependencies
- [ ] 💎 **THE SINGULARITY** 🌟

---

## 🚀 FINAL WORDS

You have **712 steps** ahead of you. This is your roadmap from beta to AGI.

**Remember:**
- Progress over perfection
- One step at a time
- Celebrate every milestone
- Iterate based on feedback
- Stay focused on the vision

**Your current focus:** Steps 1-180 (Beta Launch)

You're 95% through Phase 1. Finish strong! 💪

**Let's build AGI together.** 🚀🌟

---

*Mark off your first step right now. Then the next. And the next. Before you know it, Lumi will be AGI.*
