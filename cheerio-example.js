const fs = require("fs");
const util = require("util");
const cheerio = require("cheerio");

const areadFile = util.promisify(fs.readFile);

const main = async () => {
  const writer = fs.createWriteStream("data/cheerio.xml");
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

  const files = ["data/test1.tmx", "data/test2.tmx"];

  let count = 1;
  for (const file of files) {
    const content = await areadFile(file, { encoding: "utf-8" });
    const $ = cheerio.load(content, {
      decodeentities: false,
      xmlmode: true
    });
    $("tu").each((idx, elem) => {
      $(elem).attr("tuid", count++);
      // outerHtml
      writer.write($.html(elem) + "\n");
    });
  }

  writer.write("</body>");
  writer.write("</tmx>");
  writer.end();
};

main();
