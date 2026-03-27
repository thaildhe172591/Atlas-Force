import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const outDir = path.join(root, '.publish', 'github-package');

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const githubPackageName = '@thaildhe172591/atlas-forge';

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const entry of ['dist', 'README.md', 'LICENSE', 'CHANGELOG.md']) {
    await cp(path.join(root, entry), path.join(outDir, entry), { recursive: true });
}

const githubManifest = {
    name: githubPackageName,
    version: packageJson.version,
    description: packageJson.description,
    type: packageJson.type,
    engines: packageJson.engines,
    bin: packageJson.bin,
    exports: packageJson.exports,
    license: packageJson.license,
    repository: packageJson.repository,
    bugs: packageJson.bugs,
    homepage: packageJson.homepage,
    keywords: packageJson.keywords,
    publishConfig: {
        registry: 'https://npm.pkg.github.com',
    },
};

await writeFile(path.join(outDir, 'package.json'), `${JSON.stringify(githubManifest, null, 2)}\n`);

process.stdout.write(`${outDir}\n`);
