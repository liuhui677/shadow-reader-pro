import cheerioModule = require("cheerio");
import axios from "axios";
import iconv = require("iconv-lite");
import { window } from "vscode";
import { Craweler } from "./interface";

const querystring = require("querystring");

export class CaimoCrawler implements Craweler {
  private readonly baseURL = "https://www.caimoge.net";
  private readonly defaultEncode = "utf-8";

  async searchBook(keyWord: string): Promise<Map<string, string>> {
    let data: string;
    let self = this;
    try {
      const response = await axios.post(
        self.baseURL + "/search/",
        querystring.stringify({ searchkey: keyWord })
      );
      data = response.data;
    } catch (error: any) {
      window.showErrorMessage(error.message);
      throw error;
    }

    const $ = cheerioModule.load(data);
    let choices = new Map<string, string>();
    $("#sitembox h3>a").each(function (_i, ele) {
      choices.set($(ele).text(), self.baseURL + $(ele).prop("href"));
    });
    return choices;
  }

  async findChapterURL(url: string): Promise<Map<string, string>> {
    let data: string;
    let self = this;
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      data = iconv.decode(response.data, this.defaultEncode);
    } catch (error: any) {
      window.showErrorMessage(error.message);
      throw error;
    }

    const $ = cheerioModule.load(data);
    let choices = new Map<string, string>();
    $("#readerlist ul a").each(function (_i, ele) {
      choices.set($(ele).text(), self.baseURL + $(ele).prop("href"));
    });
    return choices;
  }
  /**
   * 因为目前所查的笔趣阁会有跳转的情况，所以这里返回原始的url
   * @param url
   * @returns
   */
  async findRealUrl(url: string): Promise<string> {
    // try {
    //   let data: string = "";
    //   const response = await ignoreSSL.get(
    //     `${bookURL}/user/geturl.html?url=${bookURL}${url}`
    //   );
    //   console.log("response", response);
    // } catch {}
    return url;
  }
}
