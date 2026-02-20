export async function getSubjects(): Promise<any[]> {
    try {
        const response = await fetch('http://localhost:8080/api/subjects');
        if (!response.ok) throw new Error('Ошибка загрузки дисциплин');
        return await response.json();
    } catch (err) {
        console.log(err);
        alert('Ошибка при загрузке дисциплин');
        return [];
    }
}