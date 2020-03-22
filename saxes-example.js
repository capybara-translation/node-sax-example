const fs = require("fs");
const util = require("util");
const saxes = require("saxes");

const areadFile = util.promisify(fs.readFile);

const escape = text => {
  const escapedChars = [
    ["&", "&amp;"],
    [">", "&gt;"],
    ["<", "&lt;"],
    ["'", "&apos;"],
    ['"', "&quot;"]
  ];
  for (const pair of escapedChars) {
    text = text.replace(new RegExp(pair[0], "g"), pair[1]);
  }
  return text;
};

const buildAttributes = node => {
  const attributes = node.attributes;
  const attrStrings = Object.keys(attributes)
    .filter(k => attributes[k])
    .map(k => `${k}="${escape(attributes[k])}"`);
  return attrStrings.join(" ");
};

const main = async () => {
  const reader = new saxes.SaxesParser();
  const writer = fs.createWriteStream("data/saxes.xml");

  const tmxHeader = `
<?xml version="1.0" encoding="utf8"?>
<tmx version="1.4">
  <header
  creationtool="xyztool"
  creationtoolversion="1.01-023"
  datatype="plaintext"
  segtype="sentence"
  adminlang="en-us"
  srclang="en"
  o-tmf="abctransmem"
  creationdate="20020101t163812z"
  creationid="thomasj"
  changedate="20020413t023401z"
  changeid="amity"
  o-encoding="iso-8859-1"
  >
  </header>
<body>\n`.trimLeft();
  writer.write(tmxHeader);

  let inTu = false;
  let tuid = 1;

  reader.on("opentag", node => {
    if (node.name === "tu" || inTu) {
      inTu = true;
      if (node.name === "tu") {
        writer.write("  ");
        node.attributes.tuid = (tuid++).toString();
      }
      const slash = node.isSelfClosing ? "/" : "";
      const attrs = buildAttributes(node);
      writer.write(`<${node.name} ${attrs}${slash}>`);
    }
  });
  reader.on("closetag", node => {
    if (inTu) {
      writer.write(`</${node.name}>`);
    }
    if (node.name === "tu") {
      writer.write("\n");
      inTu = false;
    }
  });
  reader.on("text", text => {
    if (inTu) {
      writer.write(escape(text));
    }
  });
  reader.on("error", e => {});
  reader.on("end", () => {});

  const files = ["data/test1.tmx", "data/test2.tmx"];
  for (const file of files) {
    const xml = await areadFile(file, { encoding: "utf-8" });
    reader.write(xml);
    reader.close();
  }

  writer.write("</body>\n</tmx>\n");
  writer.close();
};
main();
