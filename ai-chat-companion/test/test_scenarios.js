const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

// 1. Define a Senior User (Matches EasyShare demographics)
const seniorUser = {
    username: "RetireeMartha",
    age: 72,
    interests: ["Retired", "Health", "Gardening"], // "Retired" and "Health" appear in dataset mappings
    location: "Austria", // Matches dataset country
    bio: "Enjoying retirement, looking to stay healthy and active.",
    points: 4500,
    experience_level: 9,
    achievements: ["Raised 3 children", "Retired Teacher"],
    wants: ["Improve health", "Socialize"],
    problems: ["Joint pain", "Loneliness"],
    current_roadmap: []
};

// 2. Define a Junior User (Looking for guidance)
const juniorUser = {
    username: "StudentAlex",
    age: 23,
    interests: ["Education", "Employed", "Career"], // "Education" and "Employed" appear in dataset mappings
    location: "Germany",
    bio: "University student looking for career advice and stability.",
    points: 300,
    experience_level: 2,
    achievements: ["High School Diploma"],
    wants: ["Find a job", "Financial independence"],
    problems: ["Student debt", "No work experience"],
    current_roadmap: []
};

async function analyzeAgent(user) {
    console.log(`\n--------------------------------------------------`);
    console.log(`ANALYZING PROFILE: ${user.username}`);
    console.log(`Looking for matches for: ${user.interests.join(", ")}`);
    console.log(`--------------------------------------------------`);

    try {
        const res = await fetch(`${BASE_URL}/api/analyze-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        process.stdout.write("Streaming Response: \n");

        // let fullJson = ""; // Already declared above

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
                    console.log("\n[Stream Complete]");
                    break;
                }
                
                try {
                    const obj = JSON.parse(payload);
                    if (obj.chunk) {
                        process.stdout.write(obj.chunk); 
                        // fullJson += obj.chunk; // We don't need to reconstruct full JSON for streaming test
                    } else if (obj.error) {
                        console.error("\nStream Error:", obj.error);
                    }
                } catch (e) {
                    // ignore
                }
            }
        }
        
    } catch (e) {
        console.error("Error running scenario:", e.message);
    }
}

async function main() {
    console.log("Running General Population Test Scenarios...");
    
    // 3. Analyze the Junior User
    await analyzeAgent(juniorUser);

    // 4. Analyze the Senior User
    await analyzeAgent(seniorUser);
}

main();
