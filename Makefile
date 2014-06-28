
viz.js:
	tsc --out bin/viz.js --sourcemap --noImplicitAny src/viz.ts

watch:
	tsc --out bin/viz.js --sourcemap --noImplicitAny src/viz.ts -w
