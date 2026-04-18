# QA Plan — FlashCards App

## Scope
Full-stack flash card memory app with user auth, deck management (CSV import), and an Anki-style study session with Known / Hard / Not Sure marking.

---

## 1. Authentication

### 1.1 Register
| # | Test | Expected |
|---|------|----------|
| R1 | Submit valid name, email, password | Account created; redirected to `/login` |
| R2 | Submit with missing field | Error shown; no account created |
| R3 | Submit duplicate email | "Email already in use" error |
| R4 | Password < 6 chars | Browser validation prevents submit |

### 1.2 Login
| # | Test | Expected |
|---|------|----------|
| L1 | Valid credentials | Redirected to `/dashboard` |
| L2 | Wrong password | "Invalid email or password" error |
| L3 | Unknown email | "Invalid email or password" error |
| L4 | Empty fields | Browser validation prevents submit |

### 1.3 Session & Sign Out
| # | Test | Expected |
|---|------|----------|
| S1 | Visit `/dashboard` while logged out | Redirected to `/login` |
| S2 | Visit `/` while logged in | Redirected to `/dashboard` |
| S3 | Click "Sign out" | Session cleared; redirected to `/login` |
| S4 | Access `/decks/[id]` for another user's deck | 404 / not found |

---

## 2. Deck Management

### 2.1 Create Deck
| # | Test | Expected |
|---|------|----------|
| D1 | Valid name + valid CSV (`question,answer` header) | Deck created; redirected to deck detail page |
| D2 | Missing name | Browser validation prevents submit |
| D3 | Missing CSV file | Browser validation prevents submit |
| D4 | CSV with no valid rows | "CSV has no valid rows" error |
| D5 | CSV missing `question` or `answer` column | Error shown |
| D6 | CSV with extra columns | Extra columns ignored; cards created correctly |
| D7 | CSV with trimmed whitespace in values | Whitespace stripped from question/answer |

### 2.2 Deck List (Dashboard)
| # | Test | Expected |
|---|------|----------|
| DL1 | No decks | "No decks yet" state shown |
| DL2 | Multiple decks | All decks listed with name, total, known, remaining counts |
| DL3 | Deck stats update after studying | Known/remaining counts reflect DB state |

### 2.3 Deck Detail
| # | Test | Expected |
|---|------|----------|
| DD1 | View deck with cards | Table shows all cards with question/answer/status |
| DD2 | Unseen card | Status shown as "Unseen" |
| DD3 | After marking Known | Status badge shows "Known" (green) |
| DD4 | After marking Hard | Status badge shows "Hard" (red) |
| DD5 | After marking Not Sure | Status badge shows "Not Sure" (amber) |

### 2.4 Delete Deck
| # | Test | Expected |
|---|------|----------|
| DEL1 | Click Delete → confirm | Deck and all cards deleted; redirected to dashboard |
| DEL2 | Click Delete → cancel | No deletion |

---

## 3. Study Session

### 3.1 Card Display & Flip
| # | Test | Expected |
|---|------|----------|
| ST1 | Enter study session | First card shown (question side) |
| ST2 | Click card | Card flips to show answer |
| ST3 | Buttons before flip | Marking buttons NOT visible |
| ST4 | Buttons after flip | Hard / Not Sure / Known buttons appear |
| ST5 | Progress bar | Advances with each card |
| ST6 | Card counter | Shows "Card N of M" |

### 3.2 Marking & Persistence
| # | Test | Expected |
|---|------|----------|
| M1 | Mark card as Known | Progress saved; next card shown |
| M2 | Mark card as Hard | Progress saved; next card shown |
| M3 | Mark card as Not Sure | Progress saved; next card shown |
| M4 | Re-enter session after marking | Cards marked Known no longer appear |
| M5 | All cards marked Known | Congratulations screen shown |
| M6 | Mix of Hard + Not Sure | Only those cards appear in next session |

### 3.3 Session Summary
| # | Test | Expected |
|---|------|----------|
| SUM1 | After last card marked | Summary screen shows Known / Not Sure / Hard counts |
| SUM2 | All cards Known in session | "All cards known!" heading |
| SUM3 | Some Hard/Not Sure remain | "Study Again" button visible |
| SUM4 | Click "Study Again" | New session with only non-Known cards |
| SUM5 | Click "Back to Deck" | Returns to deck detail page |

### 3.4 Edge Cases
| # | Test | Expected |
|---|------|----------|
| E1 | All cards already Known before session | "All cards are known!" screen immediately |
| E2 | Single card deck | Session works; summary after 1 card |
| E3 | Reset progress | All progress deleted; all cards appear again |
| E4 | Cards shown in random order | Order differs between sessions (probabilistic) |

---

## 4. API Security
| # | Test | Expected |
|---|------|----------|
| SEC1 | `GET /api/decks` without session | 401 Unauthorized |
| SEC2 | `POST /api/decks` without session | 401 Unauthorized |
| SEC3 | `POST /api/decks/[id]/progress` invalid status | 400 Bad Request |
| SEC4 | `DELETE /api/decks/[id]` for another user's deck | 404 Not Found |

---

## 5. Words Feature

### 5.1 Tab Navigation
| # | Test | Expected |
|---|------|----------|
| W-N1 | Visit `/dashboard` | "Decks" tab active (indigo underline) |
| W-N2 | Click "Words" tab | Navigates to `/words`, "Words" tab active |
| W-N3 | Click "Decks" tab from Words | Returns to `/dashboard` |

### 5.2 Empty State
| # | Test | Expected |
|---|------|----------|
| W-E1 | `/words` with no words | "No words yet" + link to add words |
| W-E2 | No filter panel shown | Correct — nothing to filter |

### 5.3 Add Word (single)
| # | Test | Expected |
|---|------|----------|
| W-A1 | Fill form: Czech="pes\|psi", Russian="собака\|псы", Type=Noun, Gender=Masculine, Topic=animals | "Word added!" + form resets |
| W-A2 | Add verb: Czech="jít", Russian="идти", Type=Verb, Gender=N/A | Success |
| W-A3 | Add phrase without topic | Success |
| W-A4 | Submit with empty Czech | Browser validation prevents submit |
| W-A5 | Navigate to `/words` | All words visible; "pes\|psi" shows as "pes · psi" in table |
| W-A6 | Gender column for verb | Shows "—" |
| W-A7 | All words show level "new" (gray badge) | Correct |

### 5.4 CSV Import
| # | Test | Expected |
|---|------|----------|
| W-C1 | Hover "Format?" | Tooltip with format example visible |
| W-C2 | Tooltip shows pipe example | "Use \| for multiple meanings" |
| W-C3 | Upload valid CSV | Redirected to `/words?imported=N` |
| W-C4 | Words from CSV appear in table | Correct |
| W-C5 | Upload CSV missing required columns | Error shown |
| W-C6 | Upload empty CSV | "No valid rows in CSV" error |

Sample word CSV:
```csv
czech,russian,gender,type,topic
kočka,кошка,feminine,noun,animals
studovat,учить,,verb,education
prosím|děkuji,пожалуйста|спасибо,,phrase,politeness
```

### 5.5 Filter UI
| # | Test | Expected |
|---|------|----------|
| W-F1 | Default levels | New, Fail, Hard, Easy active; Know inactive |
| W-F2 | Start button count | Matches words with active level filters |
| W-F3 | Toggle "Know" on | Count increases to include known words |
| W-F4 | Toggle type "Noun" | Only nouns counted |
| W-F5 | Toggle same type again | All types included again |
| W-F6 | Topic tags appear | Topics from words shown |
| W-F7 | 0 words match | Button disabled |
| W-F8 | Direction default | CZ → RU selected |

### 5.6 Study Session
| # | Test | Expected |
|---|------|----------|
| W-S1 | Start with CZ→RU | Card front shows Czech label |
| W-S2 | Click card | Flips to Russian translation |
| W-S3 | Back shows metadata | Type, gender (if not n/a), topic badges |
| W-S4 | "pes\|psi" shows as "pes · psi" | Pipe replaced |
| W-S5 | 4 buttons after flip | Fail (red), Hard (amber), Easy (blue), Know (green) |
| W-S6 | Click "Know" | Next card shown, progress bar advances |
| W-S7 | Back button on card 2+ | Returns to previous card |
| W-S8 | Mark all cards | Summary screen with fail/hard/easy/know counts |
| W-S9 | "Back to Words" | Returns to `/words` |
| W-S10 | Level badge updated | Word marked "know" shows green badge |
| W-S11 | RU→CZ direction | Front shows Russian, back shows Czech |
| W-S12 | No matching words | "No words match your filters" message |

### 5.7 Delete Words
| # | Test | Expected |
|---|------|----------|
| W-D1 | Click "Delete" | Word removed from table immediately |
| W-D2 | Filter count updates | Start button count decreases |

### 5.8 Regression — Deck Functionality
| # | Test | Expected |
|---|------|----------|
| W-R1 | Dashboard deck list | Unchanged |
| W-R2 | Create new deck | Works as before |
| W-R3 | Study deck | Hard / Not Sure / Known buttons (unchanged) |

---

## 6. Automated Test Coverage (Playwright E2E)
- Happy path: register → create deck → study all cards → verify Known exclusion
- Auth guard: unauthenticated access to protected routes
- API smoke tests: register, login, deck CRUD, progress update

---

## Test Data

### Sample CSV (`sample.csv`)
```csv
question,answer
What is the capital of France?,Paris
What is 2 + 2?,4
What language does Next.js use?,JavaScript/TypeScript
Who wrote Hamlet?,Shakespeare
What does HTTP stand for?,HyperText Transfer Protocol
```

### Bad CSV (no header)
```csv
Paris,France
4,2+2
```

### Bad CSV (wrong columns)
```csv
front,back
Paris,France
```
