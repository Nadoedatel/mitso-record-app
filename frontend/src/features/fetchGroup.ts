export async function getGroup(): Promise<string[]> {
    try {
        const urlGroup = 'http://localhost:8080/api/groups';
        const response = await fetch(urlGroup);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.log(err);
        return [];
    }
}