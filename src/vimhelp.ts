import {execVim} from "./exec_vim";

export type RTPProvider = () => string[];

export class VimHelp {
  helplang: string[];
  rtpProvider?: () => string[];

  constructor(
    public vimBin = "vim",
  ) {
    this.vimBin = vimBin;
    this.helplang = [];
  }

  search(word: string): Promise<string> {
    const safeWord = word.replace(/\|/g, "bar");
    const commands = [
      `verbose silent help ${safeWord}`,
      [
        "?\\%(^\\s*$\\|[^*]$\\)?",
        "/\\*\\S\\+\\*/",
        ";",
        "/^*\\|[^*]$/",
        "-1",
        "/^\\s*\\*\\S\\+\\*\\|\\*\\S\\+\\*\\s*\\%(>\\)\\=$/",
        "?^[^=-].*[^=-]$?",
        "print"
      ].join("")
    ];
    const runtimepaths = this.rtpProvider?.() || [];
    const preCommands = runtimepaths.map((rtp) =>
      `set runtimepath+=${rtp.replace(/[\\, ]/, "\\\0")}`
    );
    preCommands.push(`set helplang=${this.helplang.join(",")}`);
    return this._execVim(preCommands.concat(commands));
  }

  _execVim(commands: string[]): Promise<string> {
    return execVim(this.vimBin, [...commands, "qall!"]);
  }

  setRTPProvider(provider: () => string[]): void {
    this.rtpProvider = provider;
  }
}
