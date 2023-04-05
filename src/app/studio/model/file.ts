import { FS } from "yao-node-client";

/**
 * yao studio run model.file.DotName table_name
 * yao studio run model.file.DotName /file/name
 * @param {string} pathname
 * @returns model name with dot
 */
export function DotName(pathname: string) {
  let str = pathname;
  str = str.replace(/\\/g, "/");
  str = str.replace(/\/\//g, "/");
  str = str.replace(/\//g, ".");
  str = str.replace(/-/g, ".");
  str = str.replace(/_/g, ".");
  let newStr = str.replace(/^\.+|\.+$/g, "");
  return newStr;
}
/**
 * yao studio run model.file.SlashName crm_help
 * @param {string} pathname
 * @returns pathname
 */
export function SlashName(pathname: string) {
  let str = pathname;
  str = str.replace(/\\/g, "/");
  str = str.replace(/_/g, "/");
  str = str.replace(/-/g, "/");
  str = str.replace(/\./g, "/");
  str = str.replace(/\/\//g, "/");
  let newStr = str.replace(/^\/+|\/+$/g, "");
  return newStr;
}
/**
 * yao studio run model.file.FileNameConvert "/models/cms__help.mod.json"
 * yao studio run model.file.FileNameConvert "/models/cms.help.mod.json"
 * yao studio run model.file.FileNameConvert "/models/cms.json"
 * @param {string} filename
 * @returns new filename
 */
export function FileNameConvert(filename: string) {
  const str = filename.replace(/[\\_-]/g, "/");
  const arr = str.split(".");
  if (arr.length < 3) {
    return str;
  }
  const suffix = arr.slice(-2);
  const header = arr.slice(0, -2);
  const str1 = header.join("/") + "." + suffix.join(".");
  return str1.replace(/\/\//g, "/");
}

/**
 * 在scripts目录写入脚本内容
 * @param fname 脚本名称
 * @param scripts 脚本内容
 */
export function WriteScript(fname: string, scripts: string) {
  let fs = new FS("script");

  if (!fs.Exists(fname)) {
    const folder = fname.split("/").slice(0, -1).join("/");
    if (!fs.Exists(folder)) {
      fs.MkdirAll(folder);
    }
  }
  fs.WriteFile(fname, scripts);
}
// export function FileNameConvert(filename: string) {
//   let str = filename;
//   str = str.replace(/_/g, "/");
//   str = str.replace(/-/g, "/");
//   str = str.replace(/\\/g, "/");
//   str = str.replace(/\/\//g, "/");
//   let arr = str.split(".");
//   if (arr.length < 3) {
//     return str;
//   }
//   let suffix = arr.slice(-2);
//   let header = arr.slice(0, -2);
//   let str1 = header.join("/");
//   str1 = str1 + "." + suffix.join(".");
//   return str1;
// }
/**
 * write file
 * yao studio run model.file.WriteFile "/models/cms_help.mod.json"
 * yao studio run model.file.WriteFile "/models/cms.help.mod.json"
 * yao studio run model.file.WriteFile "/models/cms.json"
 * @param {string} filename filename
 * @param {object} data
 */
export function WriteFile(filename: string, data: object) {
  const fs = new FS("dsl");
  const nfilename = FileNameConvert(filename);

  if (!fs.Exists(nfilename)) {
    const folder = nfilename.split("/").slice(0, -1).join("/");
    if (!fs.Exists(folder)) {
      fs.MkdirAll(folder);
    }
  }

  fs.WriteFile(filename, JSON.stringify(data));
}
// export function WriteFile(filename: string, data: object) {
//   let nfilename = FileNameConvert(filename);

//   let fs = new FS("dsl");
//   if (!fs.Exists(nfilename)) {
//     let paths = nfilename.split("/");
//     paths.pop();
//     let folder = paths.join("/");

//     if (!fs.Exists(folder)) {
//       // console.log("make folder", folder);
//       fs.MkdirAll(folder);
//     }
//   }
//   // console.log("write file:", nfilename);
//   fs.WriteFile(filename, JSON.stringify(data));
// }

/**
 * yao studio run model.file.MoveAndWrite
 * @param folder Yao应用目录，相对于Yao App根目录
 * @param file
 * @param data
 */
export function MoveAndWrite(folder: string, file: string, data: object) {
  Move(folder, file);
  WriteFile(`/${folder}/` + file, data);
}

/**
 * yao studio run model.move.Move
 * 文件复制移动逻辑
 */
export function Move(dir: string, name: string) {
  const fs = new FS("dsl");
  const base_dir = ".trash";

  // 判断文件夹是否存在.不存在就创建
  Mkdir(base_dir);
  const new_dir = Math.floor(Date.now() / 1000);
  // models的文件移动到
  const target_name = dir + "/" + name;

  // 如果已经存在
  if (fs.Exists(dir + "/" + name)) {
    Mkdir(base_dir + "/" + new_dir);
    fs.Copy(target_name, `${base_dir}/${new_dir}/${name}`);
    // 复制完成后,删除文件
    fs.Remove(target_name);
  } else {
    return false;
  }
}
export function Mkdir(name: string) {
  const fs = new FS("dsl");
  const res = fs.Exists(name);
  if (res !== true) {
    fs.MkdirAll(name);
  }
}

export function Copy(from: string, to: string, name: string) {
  const fs = new FS("dsl");
  fs.Copy(from, to + "/" + name);
}
/**
 * 查看模型是否存在
 * @param {*} file_name
 * @returns
 */
export function Exists(dir: string, file_name: string) {
  const fs = new FS("dsl");
  const res = fs.Exists(dir + "/" + file_name);
  return res;
}
