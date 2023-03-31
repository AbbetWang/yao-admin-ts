import { YaoForm, YaoModel } from "yao-app-ts-types";
import { Studio } from "yao-node-client";
import { FieldColumn } from "./types";

/**
 * yao studio run selector.Select
 * 把hasOne变成下拉选择
 * @param {*} column
 * @param {*} model_dsl
 * @param {*} component
 * @returns
 */
export function Select(
  column: YaoModel.ModelColumn,
  model_dsl: YaoModel.ModelDSL,
  component: FieldColumn
) {
  const props = column.props || {};
  // const title = column.label;
  const name = column.name;

  const bind = `${name}`;
  const relation = model_dsl.relations;
  for (const rel in relation) {
    if (
      relation[rel].type == "hasOne" &&
      column.name == relation[rel]["foreign"]
    ) {
      const dotName = Studio("file.DotName", relation[rel].model);
      const field = Studio("remote.select", rel, relation[rel]);
      let component: FieldColumn = {
        is_select: true,
        // bind: i + "." + field,
        bind,
        view: {
          type: "Tag",
          props: {
            xProps: {
              $remote: {
                process: "yao.component.SelectOptions",
                query: {
                  model: dotName,
                  label: field,
                  value: "id",
                },
              },
            },
            ...props,
          },
        },
        edit: {
          type: "Select",
          props: {
            xProps: {
              $remote: {
                process: "yao.component.SelectOptions",
                query: {
                  model: dotName,
                  label: field,
                  value: "id",
                },
              },
            },
            ...props,
          },
        },
      };
      component = Withs(component, rel);
      return component;
    }
  }
  return component;
}

export function EditSelect(
  column: YaoModel.ModelColumn,
  model_dsl: YaoModel.ModelDSL,
  component: FieldColumn
) {
  const props = column.props || {};
  const name = column.name;
  const bind = `${name}`;
  const relation = model_dsl.relations;

  for (const rel in relation) {
    if (
      relation[rel].type == "hasOne" &&
      column.name == relation[rel]["foreign"]
    ) {
      const field = Studio("remote.select", rel, relation[rel]);
      let component: FieldColumn = {
        bind: bind,
        edit: {
          type: "Select",
          props: {
            xProps: {
              $remote: {
                process: "yao.component.SelectOptions",
                query: {
                  model: Studio("file.DotName", relation[rel].model),
                  label: field,
                  value: "id",
                },
              },
            },
            ...props,
          },
        },
      };
      component = Withs(component, rel);
      return component;
    }
  }
  return component;
}

/**增加关联表关系 */
function Withs(component: FieldColumn, relation_name: string) {
  const withs = [];
  withs.push({
    name: relation_name,
  });
  component.withs = withs;
  return component;
}

/**
 * 把hasMany变成表单中的Table
 */
export function Table(form_dsl: YaoForm.FormDSL, model_dsl: YaoModel.ModelDSL) {
  const relation = model_dsl.relations;
  for (const rel in relation) {
    // console.log(`translate.translate:${i}`);

    const translate = Studio("relation.translate", rel);
    if (relation[rel].type == "hasMany") {
      form_dsl.fields.form["表格" + translate] = {
        bind: "id",
        edit: {
          type: "Table",
          props: {
            model: relation[rel]["model"],
            query: {
              [`where.${relation[rel].key}.eq`]: "{{id}}",
            },
          },
        },
      };
      form_dsl.layout.form.sections.push({
        // title: "表格" + translate + "信息",
        // desc: "表格" + translate + "信息",
        columns: [{ name: "表格" + translate, width: 24 }],
      });
    }
  }
  return form_dsl;
}
