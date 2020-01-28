PACKAGES=$(yarn lerna list --all --include-dependencies --toposort --scope dovexpress -p --loglevel error)

mkdir -p /tmp/shit/packages
cp {.nvmrc,.yarnrc,.yarnrc.yml,yarn.lock} /tmp/shit/
rsync .yarn/ /tmp/shit/.yarn/ -a

echo "$PACKAGES" | while read line; do
  rsync "$line"/ /tmp/shit/packages/"$(basename "$line")"/ -a --exclude="node_modules" --info=progress2
done

rsync /tmp/shit/packages/dovexpress/ /tmp/shit/ -a --info=progress2
rm -Rf /tmp/shit/packages/dovexpress/

node -e 'fs.writeFileSync(process.argv[1], JSON.stringify(Object.assign(JSON.parse(fs.readFileSync(process.argv[1], "utf-8")), {"workspaces": ["packages/*"]}), null, 2))' /tmp/shit/package.json

pushd /tmp/shit
node .yarn/releases/yarn-1.21.1.js install --frozen-lockfile --production