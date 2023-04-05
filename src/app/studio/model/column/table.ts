import { YaoModel, YaoTable } from "yao-app-ts-types";
import { log, Studio } from "yao-node-client";
import { TableDefinition, FieldColumn } from "../../types";

//create table from model
export function toTable(modelDsl: YaoModel.ModelDSL) {
  const copiedObject: YaoModel.ModelColumn[] = JSON.parse(
    JSON.stringify(modelDsl.columns)
  );

  let columns = copiedObject || [];

  const table_dot_name = Studio("model.file.DotName", modelDsl.table.name);

  let tableTemplate: YaoTable.TableDSL = {
    name: modelDsl.name || "表格",
    action: {
      bind: {
        model: table_dot_name,
        option: { withs: {}, option: { form: table_dot_name } },
      },
    },
    layout: {
      primary: "id",
      header: { preset: {}, actions: [] },
      filter: {
        columns: [],
        actions: [
          {
            title: "添加",
            icon: "icon-plus",
            width: 3,
            action: [
              {
                name: "OpenModal",
                type: "Common.openModal",
                payload: {
                  Form: { type: "edit", model: table_dot_name },
                },
              },
            ],
          },
        ],
      },
      table: {
        columns: [],
        operation: {
          fold: false,
          actions: [
            {
              title: "查看",
              icon: "icon-eye",
              action: [
                {
                  payload: {
                    Form: {
                      model: table_dot_name,
                      type: "view",
                    },
                  },
                  name: "OpenModal",
                  type: "Common.openModal",
                },
              ],
            },
            {
              title: "编辑",
              icon: "icon-edit-2",
              action: [
                {
                  name: "OpenModal",
                  type: "Common.openModal",
                  payload: {
                    Form: {
                      type: "edit",
                      model: table_dot_name,
                    },
                  },
                },
              ],
            },
            {
              title: "删除",
              icon: "icon-trash-2",
              action: [
                {
                  name: "Confirm",
                  type: "Common.confirm",
                  payload: {
                    title: "确认删除",
                    content: "删除后不可撤销！",
                  },
                },
                {
                  name: "Delete",
                  type: "Table.delete",
                  payload: {
                    model: table_dot_name,
                  },
                },
              ],
            },
          ],
        },
      },
    },
    fields: {
      filter: {},
      table: {},
    },
  };
  columns = Studio("model.column.utils.MakeColumnOrder", columns);

  columns.forEach((column) => {
    let table: false | TableDefinition = Cast(column, modelDsl);
    if (table) {
      table.layout.table.columns.forEach((tc) => {
        tableTemplate.layout.table.columns.push(tc);
      });
      table.fields.table.forEach((c) => {
        // let cop = c.component.withs || [];
        // cop.forEach((fct: { name: string }) => {
        //   tableTemplate.action.bind.option.withs[fct.name] = {};
        // });
        // delete c.component.withs;
        tableTemplate.fields.table[c.name] = c.component;
      });

      table.fields.filter.forEach((ff) => {
        tableTemplate.layout.filter.columns.push({ name: ff.name, width: 4 });
        tableTemplate.fields.filter[ff.name] = ff.component;
      });
    }
  });
  tableTemplate.action.bind.option.withs = Studio(
    "model.relation.GetWiths",
    modelDsl
  );
  return tableTemplate;
}
/**
 * yao run studio model.column.table.Cast
 * @param column 模型列定义
 * @param modelDsl 模型定义
 * @returns 表定义
 */
export function Cast(
  column: YaoModel.ModelColumn,
  modelDsl: YaoModel.ModelDSL
): false | TableDefinition {
  // const props = column.props || {};
  let title = column.label || column.name;
  const name = column.name;

  // 不展示隐藏列
  let hidden = Studio("model.column.component.HiddenFields", true);
  if (hidden.indexOf(name) != -1) {
    // console.log("castTableColumn: hidden");
    return false;
  }
  const typeMapping = Studio("model.column.component.GetTypes");

  if (!name) {
    // console.log("castTableColumn: missing name");
    log.Error("castTableColumn: missing name");
    return false;
  }

  if (!title) {
    // console.log("castTableColumn: missing title");
    log.Error("castTableColumn: missing title");
    return false;
  }

  let res = {
    layout: {
      filter: { columns: [] },
      table: { columns: [] },
    },
    fields: {
      filter: [],
      table: [],
    },
  } as TableDefinition;

  const bind = name;
  let component = {
    is_select: false,
    bind: name,
    view: { type: "Text", props: {} },
    edit: {
      type: "Input",
      bind: bind,
      props: {},
    },
  } as FieldColumn;

  let width = 160;
  if (title.length > 5) {
    width = 250;
  }

  // 如果是json的,去看看是不是图片文件
  if (column.type === "json") {
    component = Studio("model.column.file.IsFile", column, null);
    if (!component) {
      //可以再优化下
      component = {
        bind: bind,
        view: {
          props: {},
          // compute: "scripts.ddic.compute.json.View",
          type: "Tooltip",
        },
        edit: {
          // compute: "scripts.ddic.compute.json.Edit",
          props: {},
          type: "TextArea",
        },
      };
    }
    // log.Error("castTableColumn: Type %s does not support", column.type);
  } else if (column.type === "enum") {
    component = {
      bind: bind,
      edit: {
        props: {
          options: Studio("model.column.component.Enum", column["option"]),
          placeholder: "请选择" + title,
        },
        type: "Select",
      },
      view: {
        props: {
          options: Studio("model.column.component.Enum", column["option"]),
          placeholder: "请选择" + title,
        },
        type: "Tag",
      },
    };
  } else if (column.type === "boolean") {
    let checkedValue: boolean | number = true;
    let unCheckedValue: boolean | number = false;
    const ismysql: boolean = Studio("model.utils.IsMysql");

    if (ismysql) {
      checkedValue = 1;
      unCheckedValue = 0;
    }
    component = {
      bind: bind,
      view: {
        type: "Switch",
        props: {
          checkedChildren: "是",
          checkedValue: checkedValue,
          unCheckedChildren: "否",
          unCheckedValue: unCheckedValue,
        },
      },
    };
  } else if (/color/i.test(column.name)) {
    component.edit.type = "ColorPicker";
    width = 80;
  } else if (column.crypt === "PASSWORD") {
    component.edit.type = "Password";
    width = 180;
  } else {
    if (column.type in typeMapping) {
      component.edit.type = typeMapping[column.type];
    }
  }

  //检查是否下拉框显示
  component = Studio("model.relation.Select", column, modelDsl, component);
  // 如果是下拉的,则增加查询条件
  if (component.is_select) {
    const where_bind = "where." + name + ".in";
    res.fields.filter.push({
      name: title,
      component: {
        bind: where_bind,
        edit: component.edit,
      },
    });
  } else {
    const filter_target = Studio("model.column.component.FilterFields");
    for (const f in filter_target) {
      if (name.indexOf(filter_target[f]) != -1) {
        res.fields.filter.push({
          name: title,
          component: {
            bind: "where." + name + ".match",
            edit: {
              type: "Input",
              compute: "Trim",
              props: { placeholder: "请输入" + title },
            },
          },
        });
      }
    }
  }
  // component = Studio("model.file.File", column, component);
  component = Studio("model.column.component.EditPropes", component, column);
  component = updateViewSwitchPropes(component, column);
  component = updateCompFromModelXgen(component, column, modelDsl);
  if (
    !component.view ||
    !component.view?.props ||
    !component.view?.props?.ddic_hide
  ) {
    res.layout.table.columns.push({
      name: title,
      width: width,
    });
  }

  delete component.is_select;
  res.fields.table.push({
    name: title,
    component: component,
  });

  return res;
}

/**
 * 更新一些编辑属性
 * @param component
 * @param column
 */
function updateViewSwitchPropes(
  component: FieldColumn,
  column: YaoModel.ModelColumn
) {
  if (!component.view) {
    return component;
  }

  if (column.type !== "Switch") {
    return component;
  }
  component.view.props = component.view.props || {};

  const { unique, nullable, default: columnDefault, type } = column;

  if (unique || (!columnDefault && !nullable)) {
    component.view.props.itemProps = { rules: [{ required: true }] };
  }

  if (column.comment) {
    component.view.props["itemProps"] = component.edit.props["itemProps"] || {};
    component.view.props["itemProps"]["tooltip"] = column.comment;
  }

  if (column.default != null) {
    const ismysql: boolean = Studio("model.utils.IsMysql");
    const defaultValue =
      ismysql && type === "Switch" ? (column.default ? 1 : 0) : column.default;

    component.view.props["defaultValue"] = defaultValue;
    component.view.props["value"] = defaultValue;
  }
  return component;
}
function updateCompFromModelXgen(
  component: FieldColumn,
  column: YaoModel.ModelColumn,
  modelDsl: YaoModel.ModelDSL
) {
  return Studio(
    "model.column.component.ModelXgen",
    component,
    column,
    modelDsl,
    "table"
  );
}
