# AI interview question generation evaluation

## Offline scenario dataset

`src/test/resources/question-generation-evaluation.json` contains 20 contexts. Each context requests five questions and includes the role, level, interview type, topic, role/topic relevance signals, and difficulty signals for a human reviewer.

| Role group | Scenarios | Difficulty coverage |
| --- | ---: | --- |
| Java Backend Developer | 4 | Beginner, intermediate, advanced |
| Spring Boot Developer | 4 | Beginner, intermediate, advanced |
| React Developer | 3 | Beginner, intermediate, advanced |
| Node.js Developer | 3 | Beginner, intermediate, advanced |
| Full Stack Developer | 3 | Beginner, intermediate, advanced |
| System Design | 3 | Beginner, intermediate, advanced |
| **Total** | **20** | **7 beginner, 7 intermediate, 6 advanced** |

`QuestionGenerationEvaluationDatasetTest` checks the dataset count, unique IDs, required scenario fields, and role/difficulty coverage. This is an offline test; it does not call the AI provider.

## Deterministic checks

`QuestionGenerationService.validate` enforces machine-checkable constraints before persistence:

- The AI response and question list must be present, with exactly the requested count.
- Question text must be nonblank and at most 1,000 characters.
- Difficulty must match the session; topic must match after trimming and ignoring case.
- Each question must have 1–8 nonblank evaluation criteria (at most 500 characters each) and 1–10 nonblank expected concepts (at most 100 characters each).
- Duplicate question text is rejected after trimming and case normalization.
- Invalid responses are not saved.

Service tests use mocked AI responses to exercise these rules. Request bounds (1–10) are validated at the HTTP request boundary. These checks establish structural validity and metadata consistency; they do not prove that an answer is relevant, correct, clear, or appropriately difficult. Text normalization also cannot detect paraphrased duplicates.

## Content-quality evaluation

Use a human technical reviewer for semantic quality. Do not treat an LLM judge as ground truth. For a repeatable review, generate one five-question batch per scenario in a separate, explicitly opted-in evaluation run, save the exact prompt/model/version and response alongside the scenario ID, then have a reviewer score each question. No paid model calls are part of ordinary unit tests.

Score each dimension from 0 to 2:

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Role relevance | Unrelated to the role | Broadly applicable but not role-specific | Tests a skill used in the target role |
| Topic relevance | Off topic | Mentions the topic but tests something else | Directly tests the requested topic |
| Difficulty | Clearly too easy or too hard | Borderline for the selected level | Fits the level signals in the dataset |
| Technical accuracy | Materially false or unsafe | Mostly correct with an imprecision | Correct and technically sound |
| Clarity | Ambiguous or unanswerable | Understandable but underspecified | Focused, concise, and answerable |
| Diversity / duplicates | Repeats another question's competency | Some overlap | Distinct competency or problem framing |
| Evaluation criteria | Missing, generic, or unscorable | Partially observable | Specific behaviors a reviewer can score |
| Expected key concepts | Missing, incorrect, or irrelevant | Partially complete | Correct concepts that cover a strong answer |

Record scores and a short evidence note per question. Flag a batch for revision if its mean score is below 1.5/2, if any question scores 0 for technical accuracy, or if role/topic relevance scores below 1. Review duplicate risk across the whole batch, including paraphrases with different wording.

### Results in this change

- Dataset coverage: **20 scenarios** across all six requested role groups and all three difficulty levels; guarded by an offline dataset test.
- Deterministic validation: covered by mocked service tests for response count, missing/blank content, difficulty and topic mismatches, duplicate text, and missing evaluation metadata.
- AI semantic quality: **not scored yet**. No provider calls were made, so there are no claims here about generated-content accuracy or quality. Run the separate reviewer procedure above to establish a baseline.

## Prompt improvement areas

The current prompt supplies the role, but its explicit matching instruction calls out difficulty, interview type, and topic rather than requiring a role-specific competency. It also asks for criteria and concepts without defining what makes them useful. Consider revising it to:

1. Require each question to assess a competency expected of the named role and state how the topic applies to that role.
2. Define difficulty anchors: beginner tests foundations; intermediate applies concepts to a realistic case and tradeoff; advanced reasons about constraints, failure modes, or scale.
3. Ask the model to vary competencies and problem framing across the batch and avoid semantic repeats, not only identical wording.
4. Require evaluation criteria to be observable and scorable, and expected concepts to be the key elements of a technically correct answer.
5. Instruct the model to avoid false premises and unsupported version-specific claims; technical accuracy still needs expert review.

These are recommendations, not proof that the model will follow them. Preserve scenario IDs and repeat the same rubric when comparing prompt versions.
