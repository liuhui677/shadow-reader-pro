import cheerioModule = require("cheerio");
import axios, { AxiosError, AxiosResponse } from "axios";
import iconv = require("iconv-lite");
import https = require("https");
import { window, workspace } from "vscode";
import { Craweler } from "./interface";

const ignoreSSL = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});
// ignoreSSL.interceptors.response.use(
//   (response: AxiosResponse) => {
//     console.log("respons", response);
//     if (response.status === 304) {
//       return new Error(response.data.message);
//     }
//     return response;
//   },
//   (error: AxiosError) => {

//     const { response } = error;
//     console.log("error", error.response?.config.);
//     if (response) {
//       return Promise.reject(response.data);
//     }
//     return Promise.reject(error);
//   }
// );
function sleep(delay: number) {
  return new Promise((reslove) => {
    setTimeout(reslove, delay);
  });
}
export interface IBookListInfo {
  /**
   * 书籍地址
   */
  url_list: string;
  url_img: string;
  /**
   * 书籍名字
   */
  articlename: string;
  /**
   * 作者
   */
  author: string;
  intro: string;
}
const bookURL = workspace.getConfiguration().get("shadowReader.onlineBookURL");
export class BiquCrawler implements Craweler {
  // private readonly baseURL = "https://www.bq03.cc";
  private readonly defaultEncode = "utf-8";

  async searchBook(keyWord: string): Promise<Map<string, string>> {
    let data: IBookListInfo[] = [];
    let count = 0;
    const retryCount = 5;
    let result;
    window.showInformationMessage(bookURL + "/user/search.html");
    while (count < retryCount) {
      try {
        const response = await ignoreSSL.get(bookURL + "/user/search.html", {
          params: { q: keyWord, so: "undefined" },
        });
        result = response;
        // if (response.data.indexOf("Verify") !== -1) {
        //     count++;
        //     await sleep(1000);
        //     continue;
        // }
        data = response.data;
        window.showInformationMessage(response.data);
        break;
      } catch (error: any) {
        window.showErrorMessage(error.message);
        throw error;
      }
    }

    if (count >= retryCount) {
      let error_msg = "遭遇验证码次数过多，稍后再试吧";
      window.showErrorMessage(error_msg);
      throw new Error(error_msg);
    }

    const $ = cheerioModule.load(data);
    let choices = new Map<string, string>();
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach((item) => {
        choices.set(`${item.articlename}(${item.author})`, item.url_list);
      });
    }
    // $("a.result-game-item-title-link").each(function (_i, ele) {
    //   choices.set($(ele).prop("title"), bookURL + $(ele).prop("href"));
    // });
    // if (choices.size == 0) {
    //   console.log(result);
    // }
    return choices;
  }
  /**
   * 查询选择书籍的目录
   * @param url
   * @returns
   */
  async findChapterURL(url: string): Promise<Map<string, string>> {
    let data: string;
    let self = this;
    try {
      const response = await axios.get(bookURL + url, {
        responseType: "arraybuffer",
      });
      data = iconv.decode(response.data, this.defaultEncode);
    } catch (error: any) {
      window.showErrorMessage(error.message);
      throw error;
    }

    const $ = cheerioModule.load(data);
    let choices = new Map<string, string>();
    $(".listmain a").each(function (_i, ele) {
      choices.set($(ele).text(), bookURL + $(ele).prop("href"));
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
