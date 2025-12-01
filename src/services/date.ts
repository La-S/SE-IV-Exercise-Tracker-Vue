export function parseToLocalDate(date: string) : Date {
    let realDate = new Date(Date.parse(date));
    realDate = new Date(realDate.getTime() + realDate.getTimezoneOffset() * 60000)
    return realDate;
}