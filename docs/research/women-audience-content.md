# Content and features to attract and retain women users

Date: 2026-10-11. Researcher run; no product files touched.

## 1. Question

What content and features would most attract and retain women (Greece first, then English speakers) in Hygieia, a free bilingual health, food, fitness and beauty PWA, and what regulatory or ethical limits apply?

## 2. Answer / TL;DR

BRAIN.md does not record a women-audience decision, so this is not a re-research. BRAIN.md only confirms skincare and nails (P7), profile (P8), workout plans and themes (incl. Rose and Lavender) are live.

- Do NOT build a cycle tracker or pregnancy tracker. It is special-category health data (GDPR Art. 9), it is the most litigated category in this market (Flo), and it would break the "no secrets, RLS, local-first" posture. Publish cycle, pregnancy and menopause as static, sourced education instead.
- Do NOT market "cycle-synced training" as a method. The best umbrella review finds the evidence weak and inconsistent. An honest "how your cycle may affect training, and why you don't need to plan around it" article is a differentiator.
- Build first: (1) a women's strength-training track and plan templates, (2) a perimenopause/menopause hub (nutrition, strength, sleep, bone health), (3) a "women's nutrition" layer (iron, folate, calcium, vitamin D, PCOS-friendly) on the existing recipes through tags and meal plans. All three are content overlays on existing tables, with no new user data.
- Then: sun protection for the Greek climate, hair and body care plus makeup-removal routines (extends `/skincare`), shopping lists, weekly plans.
- Tone: body-positive, no weight-loss framing, bilingual parity (the repo's definition of done).

## 3. Ranked proposals

Effort: S = content overlay only; M = new page/feature on existing tables; L = schema change.

1. **Strength training for women (track + 3 plan templates, myth-busting).**
   - Why: Sweat, the category leader, is positioned as "Fitness App For Women" with strength, HIIT, pilates and community ([App Store listing](https://apps.apple.com/us/app/-/id1049234587), read 2026-10-11). Resistance training improves bone density in postmenopausal women: a network meta-analysis of 19 studies and 919 participants favoured moderate-intensity RT three days a week ([Frontiers in Physiology 2023, PMC9941565](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9941565/)).
   - Effort: S. Uses the existing workouts, plan builder and logger.
   - Risks: low. Avoid "toning" and weight-loss language.

2. **Perimenopause and menopause hub.**
   - Why: demand is growing. JAMA Netw Open's Google Trends analysis (2005-2025) says about 1 in 3 menopause searches were commercial by 2025 versus 1 in 5 to 7 in 2010, with apps among the top commercial queries ([JAMA Netw Open](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2849881)). Exploding Topics lists "menopause" at 673K search volume (+120%) and "perimenopause app" at 480 (+355%, small base) ([Exploding Topics](https://explodingtopics.com/topic/perimenopause-app)). These are global figures. Vitamin D inadequacy is notably high in post-menopausal Greek women ([Athens vitamin D paradox](https://arh.amegroups.org/article/view/4866/html)).
   - Content: symptoms-to-discuss-with-a-doctor, strength and calcium/vitamin D food guides, sleep, a "no hormone advice" boundary.
   - Effort: S to M (tips overlay plus a diet-plan tag).
   - Risks: no treatment claims (HRT, supplements). Cite NICE, NAMS or EMAS-type sources, and add a "see a doctor" section.

3. **Women's nutrition layer: iron, folate, calcium, vitamin D, PCOS-friendly.**
   - Why: it adds value without new data. Existing diet, recipe and meal-plan tags can carry "iron-rich", "calcium-rich" and "vitamin D" filters. Greek data: dietary vitamin D intake below the EAR in essentially everyone, with the worst inadequacy in post-menopausal women ([Athens study](https://arh.amegroups.org/article/view/4866/html)). A University of Athens study of iron status exists for women aged 18-49, but I did not read its prevalence figures (UNVERIFIED).
   - Effort: S to M (tags, plus "what's in my fridge" nutrient filters).
   - Risks: supplement dosing (do not give doses); PCOS framing must be "dietary pattern ideas, not treatment".

4. **Sun protection for the Greek climate (face and body).**
   - Why: it fits the existing skincare page and has strong local relevance. I found no sourced Greek UV or skin-cancer figures in this run (UNVERIFIED, see gaps).
   - Effort: S. Content: SPF, reapplication, beach and city use, nails and lips.
   - Risks: cite WHO, EADV or the Hellenic dermatology society.

5. **Hair care, body care, makeup basics and makeup removal routines.**
   - Why: it extends the existing skincare routines (face and nails) to the rest of the beauty category women search for. I did not find a sourced search-volume figure for Greece (UNVERIFIED).
   - Effort: S to M. The skincare schema may need new "areas" values, and a seed change if the area is an enum. Check before promising.
   - Risks: avoid cosmetic efficacy claims ("anti-ageing"); mention ingredient safety only where sourced.

6. **Weekly plan + shopping list (diet-plan to grocery list, with meal cost).**
   - Why: this is the retention loop of Lifesum and Yazio-type apps. I did not source their retention data (UNVERIFIED), so this rests on feature positioning only. It reuses the recipe cost estimates.
   - Effort: M. Local-only storage is enough.
   - Risks: low.

7. **Sleep, stress and self-care routines (a daily tasks advisor "women's pack").**
   - Why: it plugs into the live tasks advisor. Women look up health information online more than men: 62% versus 50% in the EU-27 in 2020 ([Statista, Eurostat data](https://www.statista.com/statistics/1247841/europe-internet-users-searching-health-information-online-by-gender)). There is no Greek breakdown by sex.
   - Effort: S.
   - Risks: no mental-health treatment claims. Add a crisis-resources note.

8. **Pelvic floor and postpartum movement guides (static, evidence-cited).**
   - Why: a common gap in mainstream fitness apps. I did not source demand data for it (UNVERIFIED).
   - Effort: S for articles. Exercise plans for postpartum women need clinician review.
   - Risks: HIGH on safety. Link to guidance (obstetric or physiotherapy bodies), exclude exercise prescription until reviewed.

9. **Pregnancy nutrition and activity basics (static, one hub).**
   - Why: folate, iron, listeria and food-safety lists are high-value. The Flo-type audience is large (about 70M MAU, close to 5M paying, per [Flo/General Atlantic 2024](https://www.generalatlantic.com/media-article/flo-health-secures-more-than-200m-investment-from-general-atlantic-to-revolutionize-womens-health-first-purely-digital-consumer-womens-health-app-to-achieve-unicorn-status/); a later boilerplate says 77M, and the figures are the company's own).
   - Effort: S to M.
   - Risks: HIGH. Tag recipes "pregnancy-safe" only after a clinical review. Do not store pregnancy status on the server.

10. **Community-lite: challenges and streaks (on-device).**
    - Why: Sweat sells community challenges ([App Store listing](https://apps.apple.com/us/app/-/id1049234587)). The profile and achievements features already exist.
    - Effort: M (a new challenge definition in content, with completion stored in the profile tables that already have RLS).
    - Risks: avoid social features that hold user-generated content (moderation, GDPR); leaderboards can feed disordered eating.

11. **Cycle-aware education page (no tracking).**
    - Why: it answers the most-searched women's-health topic without data risk. Evidence: a 2023 umbrella review found variable findings and concluded it is premature to say short-term hormone shifts appreciably change performance or adaptations; many studies did not verify cycle phase ([Frontiers in Sports and Active Living 2023](https://www.frontiersin.org/articles/10.3389/fspor.2023.1054542/pdf)). Frame: "listen to your body; adjust if symptoms hit."
    - Effort: S.
    - Risks: do not present phase-based programmes as proven.

12. **Optional on-device cycle log (only if the operator insists).**
    - Why: sits at the Flo/Clue core. Effort: L, and the highest risk (see section 5).
    - Recommendation: do not build now.

## 4. Recommended first 3

1. Strength training for women (proposal 1). It is quick, evidence-backed, uses existing machinery, and has a clear brand angle.
2. Perimenopause/menopause hub (proposal 2). The topic is growing, and mainstream Greek apps rarely serve it (UNVERIFIED).
3. Women's nutrition layer (proposal 3) with sun protection (4) as the quick follow-up.

All need both `el` and `en` strings, sources on each tip, the disclaimer, and Rose/Lavender theme checks.

## 5. Regulatory and ethical cautions

- Health data (cycle, pregnancy) is Art. 9 special-category data under GDPR. It needs an Art. 6 basis plus an Art. 9 condition, usually explicit consent ([Taylor Wessing femtech](https://www.taylorwessing.com/en/insights-and-events/insights/2021/10/dl-femtech-getting-data-protection-right-in-health-apps); law-firm commentary, not regulator guidance. I did not locate an EDPB document).
- Precedent: a 2021 FTC order against Flo; an August 2025 jury verdict against Meta (CIPA; one source also says CMIA); Flo settled the same trial; a $59.5M class settlement with Google, Flo and Flurry (preliminary approval April 2026, final hearing 2026-10-29) ([Digital Health](https://www.digitalhealth.net/2025/08/meta-found-liable-for-using-period-tracking-data-from-flo-health/), [Paubox](https://www.paubox.com/blog/google-flo-health-and-flurry-to-pay-59.5-million)). Sources disagree on details.
- The EU MDR generally excludes wellness apps without a diagnostic function (same law-firm commentary). Avoid "diagnose", "treat", "cure" and "balance hormones".
- The fleet telemetry client must never log profile health fields.

## 6. Confidence and gaps

- No Google Trends data for Greece was obtained (tool limits). Greek demand is inferred from global trends and the EU-wide Eurostat figure. Run Trends manually for the Greek terms for menopause (εμμηνόπαυση), PCOS, sunscreen (αντηλιακό) and hair loss.
- No Greek menopause or app-use survey was found. The Greek activity studies found are old (2005-2009), not used.
- Sweat/Lifesum/Yazio user demographics and retention: not sourced. The Sweat revenue figures came from a vendor blog and were not used.
- Market-size reports for menopause apps conflict ($100M versus $1.2B for 2022); ignore them.
- The cycle evidence rests on one umbrella review plus commentary; its authors are prominent in this debate.

## 7. Conflicts with repo decisions

- No direct conflict. Proposals 1-8, 11 fit the stack and the informational-not-medical rule.
- Proposals 9, 10 and 12 touch the "informational, not medical advice" rule and RLS/GDPR posture. Any user-held data needs a new table with RLS and a cross-tenant test (non-negotiable 2), a migration via the operator-gated applier (ADR-0003), and a privacy page update.
- Any AI-generated content or estimates would need the server-side proxy (CLAUDE.md section 11).
