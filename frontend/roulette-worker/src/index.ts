/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request: Request) {
		const url = new URL(request.url);

		if (url.pathname === "/spin") {
			return handleSpin();
		}

		return new Response("Not found", { status: 404 });
	}
};

function spinNumber(): number {
	return Math.floor(Math.random() * 37);
}

function buildResult(number: number) {
	const redNumbers = [
		1,3,5,7,9,12,14,16,18,
		19,21,23,25,27,30,32,34,36
	];

	const tags: string[] = [];

	if (number === 0) {
		tags.push("green");
	} else {
		tags.push(redNumbers.includes(number) ? "red" : "black");

		tags.push(number % 2 === 0 ? "even" : "odd");

		if (number % 3 === 1) tags.push("column1");
		else if (number % 3 === 2) tags.push("column2");
		else tags.push("column3");

		if (number <= 12) tags.push("dozen1");
		else if (number <= 24) tags.push("dozen2");
		else tags.push("dozen3");

		if (number <= 18) tags.push("low");
		else tags.push("high");
	}

	return { number, tags };
}

async function handleSpin() {
	const number = spinNumber();
	const result = buildResult(number);

	return new Response(JSON.stringify(result), {
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*"
		}
	});
}
