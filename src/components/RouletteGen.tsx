export function RouletteGen(number: number){
    /*
    Spin Result takes an input number (should be a random num) and returns a "result" that contains the
    winning number along with what winning conditions that number meets to allow for bets
    */
    function spinResult(number: number) {
        const redNumbers = [
            1,3,5,7,9,12,14,16,18,
            19,21,23,25,27,30,32,34,36
        ];
        let result: {
            number: number;
            tags: string[];
        } = {
            number: -1,
            tags: []
        };
        result.number = number;

        if (number === 0) {result.tags.push("green"); return result; }
        else if (redNumbers.includes(number)) {result.tags.push("red")}
        else if (!redNumbers.includes(number)) {result.tags.push("black")}

        if (number%2 === 0) {result.tags.push("even")}
        else if (number%2 !== 0) {result.tags.push("odd")}

        if (number%3 === 2) {result.tags.push("column1")}
        else if (number%3 === 1) {result.tags.push("column2")}
        else if (number%3 === 0) {result.tags.push("column3")}

        if (number <= 12) {result.tags.push("dozen1")}
        else if (number <= 24) {result.tags.push("dozen2")}
        else if (number <= 36) {result.tags.push("dozen3")}

        if (number <= 18) {result.tags.push("low")}
        else if (number >= 19) {result.tags.push("high")}

        return result; // this should return the number rolled and what conditions it meets
    }
    return spinResult(number);
}
