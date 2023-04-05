import { FS, Process, Studio } from "yao-node-client";
import { YaoFlow, YaoMenu, YaoModel } from "yao-app-ts-types";

export function Create(modelDsl: YaoModel.ModelDSL[]) {
  let insert = [] as YaoMenu.MenuItems;
  // let child = [];
  const total = modelDsl.length;
  insert.push({
    blocks: 0,
    icon: "icon-activity",
    id: 1,
    name: "数据模型",
    parent: null,
    path: "/x/Chart/dashboard",
    visible_menu: 0,
  });

  const english = /^[A-Za-z0-9\._-]*$/;

  for (let i = 0; i < modelDsl.length; i++) {
    // }
    // for (const i in modelDsl) {
    // const element = modelDsl[i];
    let tableName = modelDsl[i].table.name;
    if (!english.test(tableName)) {
      tableName = modelDsl[i].table.comment;
    }

    // const trans = Studio("model.translate.translate", tableName);
    const dotName = Studio("model.file.DotName", tableName);
    const icon = GetIcon(tableName);

    let item: YaoMenu.MenuItem = {
      name: modelDsl[i].table.comment,
      path: "/x/Table/" + dotName, //转换后的
      icon: icon,
      rank: i + 1,
      status: "enabled",
      visible_menu: 0,
      extra: tableName, //需要用来处理chart.json数据
      blocks: 0,
      id: (i + 1) * 10,
      children: [],
    };
    if (total >= 10) {
      item.visible_menu = 1;
      // child.push(item);
      if (i == 0) {
        item.icon = "icon-align-justify";
        insert[1] = item;
      } else {
        insert[1]["children"].push(item);
      }
    } else {
      insert.push(item);
    }
  }
  // Studio("model.move.Mkdir", "flows");
  Studio("model.move.Mkdir", "flows/app");
  const fs = new FS("dsl");

  const dsl: YaoFlow.Flow = {
    name: "APP Menu",
    nodes: [],
    output: {
      items: insert,
      setting: [
        {
          icon: "icon-settings",
          id: 999999,
          name: "设置",
          path: "/setting",
          children: [
            {
              id: 10002,
              name: "系统设置",
              path: "/setting",
            },
          ],
        },
      ],
    },
  };

  const json = JSON.stringify(dsl);
  // console.log(`create menu:/flows/app/menu.flow.json`);
  fs.WriteFile("/flows/app/menu.flow.json", json);

  // 创建看板
  if (total >= 10) {
    Studio("model.dashboard.Create", insert, 1);
  } else {
    Studio("model.dashboard.Create", insert, 2);
  }

  //Process("models.xiang.menu.insert", columns, insert);
}

/**yao studio run model.menu.icon user
 * 获取菜单图标
 * @param {*} name
 */
export function GetIcon(name: string) {
  let useTranslate = Process("utils.env.Get", "USE_TRANSLATE");
  if (useTranslate !== "TRUE") {
    return "icon-box";
  }

  let url = "https://brain.yaoapps.com/api/icon/search?name=" + name;
  let response = Process("xiang.network.Get", url, {}, {});
  if (response.status == 200) {
    return response.data.data;
  }

  return "icon-box";
}