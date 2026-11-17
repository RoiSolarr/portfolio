// Parse Gemini's JSON answer and build the call to app.save_analysis.
// user_id comes from the webhook body, which only the Next.js server can send
// (secret header) after it verified the signed in session.
const body = $('Webhook').first().json.body || {};
const job = $('Clean Job Text').first().json;
const resume = $('Get Active Resume').first().json || {};
const model = $('Build Gemini Request').first().json.model;
const res = $input.first().json || {};
const raw = res?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';

let ai;
try {
  ai = JSON.parse(raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim());
} catch (e) {
  throw new Error('Gemini did not return valid JSON. Try again.');
}

const clean = (v, max, fallback = null) => {
  const s = String(v ?? '').trim();
  return s && s.toLowerCase() !== 'unknown' ? s.slice(0, max) : fallback;
};
const list = (v, max) => (Array.isArray(v) ? v : [])
  .map((x) => String(x).trim().slice(0, 120)).filter(Boolean).slice(0, max);

const score = Math.max(0, Math.min(100, Math.round(Number(ai.fit_score) || 0)));

// The database only accepts these four verdicts (check constraint)
const VERDICTS = ['Strong fit', 'Good fit', 'Stretch', 'Weak fit'];
const verdict = VERDICTS.find((v) => v.toLowerCase() === String(ai.verdict || '').trim().toLowerCase())
  || (score >= 85 ? 'Strong fit' : score >= 70 ? 'Good fit' : score >= 50 ? 'Stretch' : 'Weak fit');

const pasted = String(body.description || '').trim().length > 0;

return [{ json: { rpc: {
  p_user_id: body.user_id,
  p_job_posting_id: body.job_posting_id || null,
  p_source_url: body.url || null,
  p_input_method: pasted ? 'pasted' : 'link',
  p_company: clean(ai.company, 200, job.hints?.company || null),
  p_title: clean(ai.title, 300, job.hints?.title || null),
  p_location: clean(ai.location, 200, job.hints?.location || null),
  p_description: job.text,
  p_resume_id: resume.id || null,
  p_fit_score: score,
  p_verdict: verdict,
  p_summary: clean(ai.summary, 2000, ''),
  p_matched_skills: list(ai.matched_skills, 12),
  p_missing_skills: list(ai.missing_skills, 10),
  p_talking_points: list(ai.talking_points, 5),
  p_cover_letter: String(ai.cover_letter || '').trim().slice(0, 20000),
  p_ai_model: model,
} } }];