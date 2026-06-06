// Node test script for AI Python backend
// Requires backend running: `uvicorn aiBackend.app:app --reload --port 8000`
// Run: `node test/test.js`
// Optionally set BASE_URL env: `set BASE_URL=http://localhost:8000` (Windows)
// Uses native fetch (Node v18+). For older Node, install node-fetch and import it.

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

async function testAnalyzeAgent() {
	const payload = {
		username: 'TestUser',
		age: 29,
		interests: ['Python', 'UI/UX', 'LLMs'],
		location: 'Remote',
		bio: 'Exploring emergent collaboration patterns.'
	};

	const res = await fetch(`${BASE_URL}/api/analyze-agent`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		throw new Error(`analyze-agent failed: ${res.status} ${await res.text()}`);
	}
	const json = await res.json();
	console.log('\n/analyze-agent response summary');
	console.log({ status: json.status, scanned_records: json.scanned_records });
	console.log('Feedback keys:', Object.keys(json.result));
    if (json.result.feedback_summary) {
        console.log('Feedback Summary Preview:', json.result.feedback_summary.substring(0, 100) + '...');
    }
	return json.result; // pass feedback onward  
}

async function testMilestoneStream(feedback) {
	console.log('\nStarting milestone SSE stream...');
	const res = await fetch(`${BASE_URL}/api/milestones/stream`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ feedback })
	});
	if (!res.ok || !res.body) {
		throw new Error(`milestones stream failed: ${res.status}`);
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let milestones = [];
	let bitVector = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		let sepIdx;
		while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
			const rawEvent = buffer.slice(0, sepIdx);
			buffer = buffer.slice(sepIdx + 2);
			if (!rawEvent.startsWith('data:')) continue;
			const payload = rawEvent.slice(5).trim();
			if (payload === '[DONE]') {
				console.log('SSE stream completed.');
				return { milestones, bitVector };
			}
			try {
				const obj = JSON.parse(payload);
				if (obj.milestone) {
					milestones.push(obj.milestone);
					console.log('Milestone:', obj.milestone.code, obj.milestone.achieved);
				} else if (obj.bit_vector) {
					bitVector = obj.bit_vector;
					console.log('Bit Vector:', bitVector);
				} else if (obj.error) {
					console.error('Stream error:', obj.error);
				} else {
					console.log('Unknown event:', obj);
				}
			} catch (e) {
				console.warn('Non-JSON SSE payload:', payload);
			}
		}
	}
	return { milestones, bitVector };
}

async function main() {
	try {
		console.log('BASE_URL =', BASE_URL);
		const feedback = await testAnalyzeAgent();
		const { milestones, bitVector } = await testMilestoneStream(feedback);
		console.log('\nSummary');
		console.log('Total milestones:', milestones.length);
		console.log('Bit vector:', bitVector);
		// Simple assertion examples
		if (!bitVector) {
			console.error('Expected bit vector to be non-empty');
			process.exitCode = 1;
		}
	} catch (err) {
		console.error('Test run failed:', err);
		process.exitCode = 1;
	}
}

main();

