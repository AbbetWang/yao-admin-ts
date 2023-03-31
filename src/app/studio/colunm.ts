import { log, Process, Studio } from "yao-node-client";
import { YaoComponent, YaoForm, YaoModel, YaoTable } from "yao-app-ts-types";
import { FieldColumn, FormDefinition, TableDefinition } from "./types";

let DbType = "";
export function getDBType() {
  if (DbType === "") {
    DbType = Process("utils.env.Get", "YAO_DB_DRIVER");
  }
  return DbType;
}
/**
 * 数据库类型与控件类型对应字段
 * @returns
 */
export function getType(): { [key: string]: YaoComponent.EditComponentEnum } {
  return {
    string: "Input",
    char: "Input",
    text: "TextArea",
    mediumText: "TextArea",
    longText: "TextArea",
    date: "DatePicker",
    datetime: "DatePicker",
    datetimeTz: "DatePicker",
    time: "DatePicker",
    timeTz: "DatePicker",
    timestamp: "DatePicker",
    timestampTz: "DatePicker",
    tinyInteger: "InputNumber",
    tinyIncrements: "InputNumber",
    unsignedTinyInteger: "InputNumber",
    smallInteger: "InputNumber",
    unsignedSmallInteger: "InputNumber",
    integer: "InputNumber",
    bigInteger: "InputNumber",
    decimal: "InputNumber",
    unsignedDecimal: "InputNumber",
    float: "InputNumber",
    boolean: "Input",
    enum: "Select",
  };
}

/**
 * 根据参数类型返回需要排除的字段列表
 * @param isTable true获取Table页面排除,false获取form布局排除字段
 * @returns 排除字段列表
 */
export function Hidden(isTable: boolean) {
  let hidden: string[] = [];
  if (isTable) {
    // Table页面不展示的字段列表
    hidden = [
      "secret",
      "password",
      "del",
      "delete",
      "deleted",
      "deleted_at",
      "pwd",
      "deleted",
    ];
  } else {
    // Form页面不展示的字段列表
    hidden = [
      "del",
      "delete",
      "deleted",
      "deleted_at",
      "created_at",
      "updated_at",
      "id",
      "ID",
      "update_time",
      "password",
      "pwd",
    ];
  }
  return hidden;
}
export function filter() {
  return ["name", "title", "_sn"];
}

//create table from model
export function toTable(model_dsl: YaoModel.ModelDSL) {
  let columns = model_dsl.columns || [];

  const table_dot_name = Studio("file.DotName", model_dsl.table.name);

  let tableTemplate: YaoTable.TableDSL = {
    name: model_dsl.name || "表格",
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
  columns = MakeColumnOrder(columns);

  columns.forEach((column) => {
    let col = castTableColumn(column, model_dsl);
    if (col) {
      // col.layout.filter.columns.forEach((fc) => {});
      col.layout.table.columns.forEach((tc) => {
        tableTemplate.layout.table.columns.push(tc);
      });
      col.fields.table.forEach((c) => {
        let cop = c.component.withs || [];
        cop.forEach((fct: { name: string }) => {
          tableTemplate.action.bind.option.withs[fct.name] = {};
        });
        delete c.component.withs;
        tableTemplate.fields.table[c.name] = c.component;
      });

      col.fields.filter.forEach((ff) => {
        tableTemplate.layout.filter.columns.push({ name: ff.name, width: 4 });
        tableTemplate.fields.filter[ff.name] = ff.component;
      });

      // col.fields.filter.forEach((ff) => {});
    }

    // col.fields.table.forEach((ft) => {
    //   tableTemplate.fields.table[ft.name] = ft.component;
    // });
  });

  return tableTemplate;
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
    return;
  }

  if (column.type !== "Switch") {
    return;
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
    const dbType = getDBType();
    const defaultValue =
      /mysql/i.test(dbType) && type === "Switch"
        ? column.default
          ? 1
          : 0
        : column.default;

    component.view.props["defaultValue"] = defaultValue;
    component.view.props["value"] = defaultValue;
  }
}
/**
 * 更新一些编辑属性
 * @param component
 * @param column
 */
function updateEditPropes(
  component: FieldColumn,
  column: YaoModel.ModelColumn
) {
  if (!component.edit) {
    return;
  }
  component.edit.props = component.edit.props || {};

  const { unique, nullable, default: columnDefault, type } = column;

  if (unique || (!columnDefault && !nullable)) {
    component.edit.props.itemProps = { rules: [{ required: true }] };
  } else if (/^id$/i.test(type)) {
    component.edit.props.itemProps = {};
  }

  if (column.comment) {
    component.edit.props["itemProps"] = component.edit.props["itemProps"] || {};
    component.edit.props["itemProps"]["tooltip"] = column.comment;
  }

  if (column.default != null) {
    const dbType = getDBType();
    const defaultValue =
      /mysql/i.test(dbType) && type === "boolean"
        ? column.default
          ? 1
          : 0
        : column.default;

    component.edit.props["defaultValue"] = defaultValue;

    if (["RadioGroup", "Select"].includes(column.type)) {
      component.edit.props["value"] = defaultValue;
    }

    if (component.view && ["Switch"].includes(column.type)) {
      component.view.props["value"] = defaultValue;
    }
  }
}
export function castTableColumn(
  column: YaoModel.ModelColumn,
  model_dsl: YaoModel.ModelDSL
) {
  // const props = column.props || {};
  let title = column.label || column.name;
  const name = column.name;

  // 不展示隐藏列
  let hidden = Hidden(true);
  if (hidden.indexOf(name) != -1) {
    // console.log("castTableColumn: hidden");
    return false;
  }
  const typeMapping = getType();

  if (!name) {
    // console.log("castTableColumn: missing name");
    log.Error("castTableColumn: missing name");
    return false;
  }
  // let newTitle = title;
  // if (/_id$/i.test(newTitle)) {
  //   title = newTitle.replace(/_id$/i, "");
  // }
  // title = Studio("relation.translate", title);

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

  const bind = `${name}`;
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
  if (column.type == "json") {
    component = Studio("file.File", column, false);
    if (!component) {
      component = {
        bind: bind,
        edit: {
          props: {
            language: "json",
            height: 200,
          },
          type: "TextArea",
        },
        view: {
          props: {},
          type: "Tooltip",
        },
      };
      res.layout.table.columns.push({
        name: title,
        width: width,
      });
    }
    // log.Error("castTableColumn: Type %s does not support", column.type);
  } else if (column.type == "enum") {
    component = {
      bind: bind,
      edit: {
        props: {
          options: Enum(column["option"]),
          placeholder: "请选择" + title,
        },
        type: "Select",
      },
      view: {
        props: {
          options: Enum(column["option"]),
          placeholder: "请选择" + title,
        },
        type: "Tag",
      },
    };
    res.layout.table.columns.push({
      name: title,
      width: width,
    });
  } else if (column.type === "boolean") {
    const dbtype = getDBType();

    let checkedValue: boolean | number = true;
    let unCheckedValue: boolean | number = false;

    if (/mysql/i.test(dbtype)) {
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
    res.layout.table.columns.push({
      name: title,
      width: width,
    });
  } else if (/color/i.test(column.name)) {
    component.edit.type = "ColorPicker";
    res.layout.table.columns.push({
      name: title,
      width: 80,
    });
  } else if (column.crypt === "PASSWORD") {
    component.edit.type = "Password";
    res.layout.table.columns.push({
      name: title,
      width: 180,
    });
  } else {
    if (column.type in typeMapping) {
      component.edit.type = typeMapping[column.type];
      res.layout.table.columns.push({
        name: title,
        width: width,
      });
    }
  }

  //检查是否下拉框显示
  component = Studio("selector.Select", column, model_dsl, component);
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
    const filter_target = filter();
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
  component = Studio("file.File", column, component);

  // component.edit = { type: "input", props: { value: bind } };
  // res.list.columns.push({ name: title });
  // res.edit.push({ name: title, width: 24 });
  // break;
  delete component.is_select;

  updateEditPropes(component, column);
  updateViewSwitchPropes(component, column);

  res.fields.table.push({
    name: title,
    component: component,
  });

  return res;
}

/**
 * 把模型中的option定义转换成控件select option对象
 * @param option 选择列表
 * @returns
 */
export function Enum(option: YaoModel.ColumnOption[]) {
  let res = [];
  for (const i in option) {
    res.push({ label: "::" + option[i], value: option[i] });
  }
  return res;
}

export function toForm(model_dsl: YaoModel.ModelDSL) {
  const table_dot_name = Studio("file.DotName", model_dsl.table.name);

  const actions = [
    {
      title: "重新生成代码",
      icon: "icon-layers",
      showWhenAdd: true,
      showWhenView: true,
      action: [
        {
          name: "StudioModel",
          type: "Studio.model",
          payload: { method: "CreateOne", args: [table_dot_name] },
        },
        {
          name: "Confirm",
          type: "Common.confirm",
          payload: {
            title: "提示",
            content: "处理完成",
          },
        },
      ],
    },
    {
      title: "返回",
      icon: "icon-arrow-left",
      showWhenAdd: true,
      showWhenView: true,
      action: [
        {
          name: "CloseModal",
          type: "Common.closeModal",
          payload: {},
        },
      ],
    },
    {
      title: "保存",
      icon: "icon-check",
      style: "primary",
      showWhenAdd: true,
      action: [
        {
          name: "Submit",
          type: "Form.submit",
          payload: {},
        },
        {
          name: "Back",
          type: "Common.closeModal",
          payload: {},
        },
      ],
    },
    {
      icon: "icon-trash-2",
      style: "danger",
      title: "Delete",
      action: [
        {
          name: "Confirm",
          type: "Common.confirm",
          payload: {
            title: "提示",
            content: "确认删除，删除后数据无法恢复？",
          },
        },
        {
          name: "Delete",
          payload: {
            model: table_dot_name,
          },
          type: "Form.delete",
        },
        {
          name: "Back",
          type: "Common.closeModal",
          payload: {},
        },
      ],
    },
  ];

  let columns = model_dsl.columns || [];

  let tableTemplate: YaoForm.FormDSL = {
    name: model_dsl.name || "表单",
    action: {
      bind: {
        model: table_dot_name,
        option: { withs: {} },
      },
    },
    layout: {
      primary: "id",
      actions,
      form: {
        props: {},
        sections: [
          {
            columns: [],
          },
        ],
      },
    },
    fields: {
      form: {},
    },
  };
  columns = MakeColumnOrder(columns);
  columns.forEach((column) => {
    let col = castFormColumn(column, model_dsl);
    if (col) {
      // col.layout.filter.columns.forEach((fc) => {});
      col.layout.forEach((tc) => {
        tableTemplate.layout.form.sections[0].columns.push(tc);
      });
      col.fields.forEach((ft) => {
        let cop = ft.component.withs || [];
        cop.forEach((fct: { name: string | number }) => {
          tableTemplate.action.bind.option.withs[fct.name] = {};
        });
        delete ft.component.withs;
        tableTemplate.fields.form[ft.name] = ft.component;
      });
      // col.fields.filter.forEach((ff) => {});
    }
  });

  tableTemplate = Studio("selector.Table", tableTemplate, model_dsl);
  return tableTemplate;
}

export function MakeColumnOrder(columns: YaoModel.ModelColumn[]) {
  const typeMapping = getType();

  let columns1: YaoModel.ModelColumn[] = [];
  let columns2: YaoModel.ModelColumn[] = [];
  columns.forEach((column) => {
    if (
      ["TextArea"].includes(typeMapping[column.type]) ||
      column.type === "json"
    ) {
      columns2.push(column);
    } else {
      columns1.push(column);
    }
  });
  return columns1.concat(columns2);
}

/**根据模型定义生成Form定义 */
export function castFormColumn(
  column: YaoModel.ModelColumn,
  model_dsl: YaoModel.ModelDSL
) {
  const types = getType();

  const title = column.label || column.name;
  const name = column.name;

  if (!name) {
    //log.Error("castFormColumn: missing name");
    return false;
  }

  if (!title) {
    // log.Error("castFormColumn: missing title");
    return false;
  }

  // 不展示隐藏列
  const hidden = Hidden(false);
  if (hidden.indexOf(name) != -1) {
    return false;
  }

  let res: FormDefinition = {
    layout: [],
    fields: [],
  };

  let component: FieldColumn = {
    bind: name,
    edit: {
      type: "Input",
      props: {},
    },
  };

  let width = 8;

  const bind = `${name}`;
  if (column.type == "json") {
    component = Studio("file.FormFile", column, false, model_dsl);
    if (!component) {
      component = {
        bind: bind,
        edit: {
          props: {
            language: "json",
            height: 200,
          },
          type: "CodeEditor",
        },
      };
    }
  } else if (column.type == "enum") {
    component = {
      bind: bind,
      edit: {
        props: {
          options: Enum(column["option"]),
          placeholder: "请选择" + title,
        },
        type: "Select",
      },
    };
  } else if (column.type === "boolean") {
    const dbtype = getDBType();

    let checkedValue: boolean | number = true;
    let unCheckedValue: boolean | number = false;

    if (/mysql/i.test(dbtype)) {
      checkedValue = 1;
      unCheckedValue = 0;
    }
    component = {
      bind: bind,
      edit: {
        type: "RadioGroup", //RadioGroup是单选项，CheckboxGroup是多选项
        props: {
          options: [
            {
              label: "是",
              value: checkedValue,
            },
            {
              label: "否",
              value: unCheckedValue,
            },
          ],
        },
      },
    };
  } else if (/color/i.test(column.name)) {
    component.edit.type = "ColorPicker";
  } else if (column.crypt === "PASSWORD") {
    component.edit.type = "Password";
  } else {
    if (column.type in types) {
      component.edit.type = types[column.type];
    }
  }

  if (["TextArea"].includes(types[column.type]) || column.type === "json") {
    width = 24;
  }
  component = Studio("selector.EditSelect", column, model_dsl, component);

  component = Studio("file.FormFile", column, component, model_dsl);

  if (component.is_image) {
    width = 24;
  }

  res.layout.push({
    name: title,
    width: width,
  });

  delete component.is_image;
  updateEditPropes(component, column);

  res.fields.push({
    name: title,
    component: component,
  });

  return res;
}
