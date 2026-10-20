# Principles

The sourced canon behind `elonify-critic`. The critic's prompt paraphrases this document; it does
not quote it. This file exists so the method can be audited against its sources, and so the
guardrails can be traced to the failures that motivated them.

**Provenance tags.** Every quote carries one:

- **[V]** wording matches across two or more independent transcripts or excerpts
- **[P]** paraphrase, or wording that varies between sources
- **[U]** commonly attributed; no primary source located

Research was done through search results only — no primary page (video, book page, official
transcript) was opened directly. Check the original before printing any quote elsewhere. The
primary sources to check by hand are listed at the end.

---

## 1. The Algorithm — five steps, in order

Source: Everyday Astronaut, *Starbase Tour with Elon Musk*, Part 1 (filmed July 2021, published
about Aug 3–4, 2021; YouTube `t705r8ICkRw`, from about 13:30). Also Walter Isaacson, *Elon Musk*
(Simon & Schuster, Sept 2023), in the chapters on the 2017–18 Nevada and Fremont production push.

| # | Step | Canonical statement |
|---|---|---|
| 1 | Make the requirements less dumb | "Your requirements are definitely dumb. It does not matter who gave them to you… It's particularly dangerous if a smart person gave you the requirements, because you might not question them enough." **[V]** |
| 2 | Delete the part or process | "The bias tends to be very strongly towards, let's add this part or process step in case we need it. But you can basically make 'in case' arguments for so many things." **[V]** |
| 3 | Simplify or optimize | "Possibly the most common error of a smart engineer is to optimize a thing that should not exist." **[V]** |
| 4 | Accelerate cycle time | Only after the first three. Isaacson: "I mistakenly spent a lot of time accelerating processes that I later realized should have been deleted." **[V/P]** |
| 5 | Automate | "That comes last. The big mistake in Nevada and at Fremont was that I began by trying to automate every step." **[V/P]** |

**Corollaries.** These come from Isaacson's text, and summaries of the book agree on them.

- Every requirement comes with the name of the person who made it, never a department ("the
  legal department", "the safety department"). Question it no matter how smart that person is:
  "even if the requirement came from me." **[V/P]**
- On the add-back test: "If you do not end up adding back at least 10% of them, then you didn't
  delete enough." **[V/P]** On the tour the wording is "If you're not occasionally adding things
  back in, you're not deleting enough." **[P]**
- He admits to running the steps out of order: "I have personally made the mistake of going
  backwards on all five steps multiple times." On the Model 3 line he "automated, accelerated,
  simplified and then deleted". **[V]**

**Worked example: the "flufferbot."** On the Q1 2018 earnings call (May 2, 2018), Musk said
Tesla "went too far in the automation front and automated some pretty silly things." **[V]** A
robot placing fiberglass mats on the battery pack kept failing. Tests with and without the mats
found no change in cabin noise. The part was deleted, not fixed. He tweeted on April 13, 2018:
"Yes, excessive automation at Tesla was a mistake. To be precise, my mistake. Humans are
underrated." **[V]**

**Why the order matters.** Each step changes what the next one works on. Optimizing a part that
step 2 would have deleted wastes the optimization. Automating a process that step 1 would have
removed builds the mistake in and makes it harder to see. The most expensive failures Musk
describes are all ordering failures.

## 2. "The best part is no part"

"The best part is no part. The best process is no process. It weighs nothing, costs nothing,
can't go wrong." **[V]** (Starship update, Boca Chica, Sept 28, 2019, reported by Spaceflight
Now.) He also said: "Undesigning is the best thing." **[P]**

Quantitative examples (secondary sources, **[P]**):

- **Raptor engine.**
  - Raptor 1: about 185 tf sea-level thrust, about 2,080 kg dry.
  - Raptor 2: about 230 tf, about 1,630 kg.
  - Raptor 3: about 280 tf, about 1,525 kg. It "doesn't require any heat shield, eliminating heat
    shield mass & complexity, as well as the fire suppression system" (Musk, Aug 2024).
  - Each generation added thrust while getting lighter and simpler.
- **Model Y rear underbody.** It went from 70 parts to one casting: "it'll go from 70 parts to 1
  with a significant reduction in capital expenditure on all the robots."
- **Induced mass.** Musk notes that Raptor 3's "induced mass" — the mass it forces onto the rest
  of the vehicle — "still has a lot of room for improvement." A deletion can move cost elsewhere
  instead of removing it.

## 3. First principles

"Boil things down to their fundamental truths and reason up from there, as opposed to reasoning
by analogy" (TED, Feb 2013). **[P/V]**

The battery example (Kevin Rose, *Foundation*, 2012) **[P]**:

- Received wisdom said battery packs cost "$600 per kilowatt hour".
- Pricing the raw materials on the London Metal Exchange put them at about $80/kWh.
- The gap between the two is design and process, not physics.

**Limit:** the material floor is a floor, not a target. Certification, yield, quality and
liability are real costs above it.

## 4. The idiot index

Isaacson describes it as the ratio of a finished part's cost to the cost of its raw materials. If
the ratio is high, the design is too complex or the process too inefficient. **[P/V]**

During the Starship surge, Musk asked an engineer for the Raptor parts with the worst ratios. The
engineer didn't know them. Musk said that if he came to the next meeting without knowing the
"idiot parts", his resignation would be accepted. The next day the engineer brought a list of the
20 worst. **[V]** (Space.com excerpt of the "Starship Surge" chapter.)

**Generalized for elonify:** the index is actual cost divided by the theoretical minimum, for any
measurable cost. Examples:

- build steps per shipped product
- ceremony commits per real change
- clicks per completed task
- calendar days per hour of hands-on work

## 5. The limiting factor, physics, urgency

- "I'm constantly addressing the limiting factor." (Cheeky Pint, with John Collison and Dwarkesh
  Patel, about Feb 2026.) **[V]** At any moment, one constraint bounds the whole system, and work
  aimed anywhere else is waste. This is the Theory of Constraints applied as a habit.
- "The only rules are the ones dictated by the laws of physics. Everything else is a
  recommendation." (Isaacson.) **[V]**
- "A maniacal sense of urgency is our operating principle." (Isaacson.) **[V]**
- Deadlines are aimed at "the 50th percentile… the most aggressive deadline I can think of that
  could be achieved with 50% probability." (Same interview as above.) **[V]**
- "If a schedule is long, it's wrong." **[U]** Not attributable.

## 6. Communication and process

**The Tesla email of April 17, 2018** **[V/P]**:

- "Excessive meetings are the blight of big companies and almost always get worse over time."
- "Walk out of a meeting or drop off a call as soon as it is obvious you aren't adding value."
- "Communication should travel via the shortest path necessary to get the job done, not through
  the 'chain of command.'"
- If a company rule would "make for a great Dilbert cartoon, then the rule should change."

**"Acronyms Seriously Suck"** (SpaceX email, May 2010) **[V]**: "Excessive use of made up acronyms
is a significant impediment to communication."

**Engineers at the point of use.** Desks were placed on the factory floor so designers sat beside
the people building their designs. **[P]** For software, that means watching the real user, the
real build, and the real failure.

## 7. Failure modes — where the method misfires

These are the reason elonify has guardrails. Each row is a documented case where the method was
applied too far.

| Case | What happened | Guardrail it motivates |
|---|---|---|
| Twitter/X, 2022–23 | Headcount fell from about 7,500 to about 1,500, including reliability engineers. Repeated outages followed, including one in early 2023 that went unfixed because the team that handled it had left (Fortune/Bloomberg). | **Redundancy is not waste.** Classify a candidate as waste or as a safety, reliability or knowledge role before cutting it. |
| Starship flight 1, Apr 2023 | Launched without a flame trench or water deluge. The pad was pulverized. | **One-way doors.** The 10% add-back assumes restoring a cut is cheap. When it isn't, test the deletion first. |
| Tesla stalk removal, 2021–23 | Gear and turn-signal stalks were removed. Turn-signal stalks came back in 2025 (Model Y refresh; China Model 3, with a retrofit). | **Frequent, safety-relevant, eyes-free controls stay direct.** Delete rare controls freely. |
| Radar and ultrasonic removal, 2021–22 | Owners reported more phantom braking. The effect is contested, not proven. | **A deletion needs data, not just a principle.** |
| Cybertruck, 2023 | "We dug our own grave with Cybertruck." | **Novelty has a production cost.** Count difficulty of manufacture as part of the cost. |
| SpaceX injuries (Reuters, Nov 2023) | At least 600 worker injuries since 2014. Employees cited deadlines and a "hatred of bureaucracy". | **Urgency never overrides life safety.** Safety rules count as physics. |
| DOGE, 2024–25 | "Mandate to delete" applied to regulation. Reported errors and legal doubts followed. | **Legal, regulatory, accessibility and security requirements have real owners.** Question them through the owner; never delete them unilaterally. |
| Model 3 automation, 2017–18 | Musk's own lesson: the line was automated before it was simplified. | **Stabilize by hand, then automate.** |

## 8. Counter-heuristics elonify adds

These are not Musk's. They pair with his method and keep it from producing the failures above.

- **Chesterton's fence.** Learn why a thing exists before you remove it: check `git log -S`,
  comments, docs and incident history.
- **Reversible vs. irreversible.** Classify every cut. A two-way door can be cut boldly. A one-way
  door needs a staged removal and a measurement.
- **Add-back triggers.** Every cut names the signal that would mean it was wrong.
- **Signal discipline.** A critic that flags everything is noise, and noise gets ignored. Cap the
  findings, rank them, and make "this is already lean" a normal answer.

## 9. Translation table

The steps apply at every altitude. This table is how the critic reads a plan, a diff, a screen or
a pipeline.

| Step | Code / architecture | UI / UX | Workflow / process |
|---|---|---|---|
| Right problem | Is this change aimed at the current bottleneck (correctness, latency, adoption, revenue)? | What is the user's actual job to be done, not the competitor's screen? | Which constraint does this process relieve? |
| Requirements | Trace every flag, option, config key, API field and dependency to an owner | Every field, step and setting needs someone who can say why it's required | Every approval, meeting and report needs a named owner |
| Delete | Dead code, unconsumed APIs, speculative integrations, duplicate apps, compatibility layers with no users | Screens, steps, fields and controls nobody needs; let defaults and inference replace them | Steps nobody will put their name to, ceremony artifacts, duplicated sources of truth |
| Simplify | Inline single-use abstractions; collapse N copies into one | Shorten the path, reduce choices | Merge steps, single-source the docs |
| Accelerate | Shorten build, test and deploy loops | Fewer clicks, faster time to first value | Shorter review and merge latency |
| Automate | CI, codegen, bots, only over what survived | Smart defaults, only after the flow is right | Scripts and hooks, only over a stable manual process |

## Primary sources to check by hand

1. The Starbase tour video, about 13:30–28:00, for the exact wording of the five steps.
2. Isaacson's printed text of the Algorithm and its corollaries, and the idiot-index passage.
3. The TED 2013 and Kevin Rose 2012 transcripts, for first principles.
4. The Q1 2018 Tesla earnings call transcript, for the flufferbot.
5. The Tesla email of April 17, 2018, and the SpaceX "Acronyms Seriously Suck" email (May 2010).
