// Тек әзірлеуші өзгертеді. Жаңа Worker жарияланған соң нақты HTTPS URL енгізіңіз.
const AI_API_URL = "https://withered-rice-14ef.vp5vy7g7db.workers.dev";
export async function askAI(payload) {
  if (!AI_API_URL.startsWith('https://')) throw new Error('ЖИ қызметі әзірге іске қосылмаған. Кейінірек қайталап көріңіз.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const res = await fetch(AI_API_URL.replace(/\/$/, '') + '/api/chat', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload), signal: controller.signal, credentials: 'omit'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'ЖИ уақытша қолжетімсіз. Кейінірек қайталаңыз.');
    if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('Жауап алынбады. Қайталап көріңіз.');
    return data.answer;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Күту уақыты аяқталды. Қысқа сұрақпен қайталаңыз.');
    if (error instanceof TypeError) throw new Error('Желімен байланыс орнамады. Кейінірек қайталаңыз.');
    throw error;
  } finally { clearTimeout(timeout); }
}
