const {expect} = require("chai");
const rewire = require("rewire");
const VIMHELP = rewire("../lib/vimhelp");
const {VimHelp} = VIMHELP;

process.on("unhandledRejection", (reason) => {
  console.log(reason);
});

describe("vimhelp", () => {
  describe("VimHelp", () => {
    let vimhelp;
    beforeEach(() => {
      vimhelp = new VimHelp();
    });
    describe(".search()", () => {
      const hijackExecVim = () => {
        let revert;
        before(() => {
          revert = VIMHELP.__set__("execVim", (vimBin, commands) => commands);
        });
        after(() => {
          revert();
        });
      };

      it("returns Promise object", () => {
        expect(vimhelp.search("help")).to.be.instanceof(Promise);
      });

      describe("the result", () => {
        // XXX: These test may fail when Vim's help will be updated.
        it("is a text from Vim's help", (done) => {
          vimhelp.search("help").then((helpText) => {
            expect(helpText).to.include("*help*");
            done();
          }).catch(done);
        });

        it("keeps the whitespaces of head", (done) => {
          vimhelp.search("G").then((helpText) => {
            expect(helpText).to.match(/^\s/);
            done();
          }).catch(done);
        });

        it("doesn't have the blank chars in tail", (done) => {
          vimhelp.search("G").then((helpText) => {
            expect(helpText).to.not.match(/\n$/);
            done();
          }).catch(done);
        });

        it("contains a range of before of a next tag from a tag", (done) => {
          vimhelp.search("CTRL-J").then((helpText) => {
            const lines = helpText.split("\n");
            expect(lines).to.have.lengthOf(5);
            expect(lines[0]).to.include("*j*");
            done();
          }).catch(done);
        });

        it("can treat a tag at the head of file", (done) => {
          vimhelp.search("helphelp.txt").then((helpText) => {
            expect(helpText).to.include("*helphelp.txt*");
            done();
          }).catch(done);
        });

        it("does not contain separator", (done) => {
          vimhelp.search("o_CTRL-V").then((helpText) => {
            expect(helpText).to.not.include("===");
            done();
          }).catch(done);
        });

        it("can separate section when the line ends with >", (done) => {
          vimhelp.search("E32").then((helpText) => {
            expect(helpText).to.include("E32");
            expect(helpText).to.not.include("E141");
            done();
          }).catch(done);
        });

        it("can handle a tag that is placed to head of line", (done) => {
          vimhelp.search("[:alpha:]").then((helpText) => {
            const lines = helpText.split("\n");
            expect(lines).to.have.lengthOf(1);
            expect(helpText).to.include("[:alpha:]");
            expect(helpText).to.not.include("[:blank:]");
            done();
          }).catch(done);
        });
      });

      it("removes extra commands", (done) => {
        vimhelp.search("help\nenew\nput ='abc'\np\nqall!").then((helpText) => {
          expect(helpText).to.include("*help*");
          done();
        }).catch(done);
      });

      it("can not execute extra commands by |", (done) => {
        vimhelp.search("help|enew").then((helpText) => {
          done(helpText);
        }).catch((error) => {
          expect(error).to.have.property("errorText")
            .that.to.match(/^E149:.*helpbarenew/);
          done();
        }).catch(done);
      });

      context("when the help does not exist", () => {
        it("throws error", (done) => {
          vimhelp.search("never-never-exist-help").then((helpText) => {
            done(helpText);
          }).catch((error) => {
            expect(error.errorText).to.match(/^E149:/);
            done();
          }).catch(done);
        });
      });

      context("when rtp provider is set", () => {
        hijackExecVim();
        beforeEach(() => {
          vimhelp.setRTPProvider(() => ["/path/to/plugin"]);
        });
        it("is set rtp from provider", () => {
          const commands = vimhelp.search("word");
          expect(commands).to.include("set runtimepath+=/path/to/plugin");
        });
      });

      context("when helplang is set", () => {
        hijackExecVim();
        beforeEach(() => {
          vimhelp.helplang = ["ja", "en"];
        });
        it("sets 'helplang' options", () => {
          const commands = vimhelp.search("word");
          expect(commands).to.include("set helplang=ja,en");
        });
      });
    });

    describe(".setRTPProvider()", () => {
      let provider;
      beforeEach(() => {
        provider = () => ["/path/to/plugin"];
      });
      it("sets a rtp provider", () => {
        vimhelp.setRTPProvider(provider);
        expect(vimhelp.rtpProvider).to.eql(provider);
      });
    });
  });
});
