build:
	- rm -R ./dist
	jspm bundle-sfx ./app/main -o ./dist/main.js --skip-source-maps
	uglifyjs ./dist/main.js -c -o ./dist/main.min.js
	gzip -c --best ./dist/main.min.js > ./dist/main.min.js.gz

test:
	mocha "./**/*.spec.js"
