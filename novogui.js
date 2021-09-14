const log = (f, ...s) => console.log(`%c[novogui] ${f}`, "color: #d57870;", ...s)
const msg = (s, id) => {
    const msg_q = sto["@dash-board"].msg.queue
    const $m = $(`<p></p>`)
        .html(s)
        .appendTo($(".clickgui > .messages"))
    $(`<span class="message-close">X</span>`)
        .appendTo($m)
        .on("click", () => {
            $m.remove()
            msg_q.$splice(msg_q.$findIndex(m => m.id === id), 1)
        })

    if (id === undefined) {
        const l = msg_q.$length
        msg_q[l] = {
            text: s,
            id: id = sto["@dash-board"].msg.last_id ++
        }
    }
}
let sto

const alwaysVisibile = "true"
const SettingType = {
    COMBOBOX: 0,
    SLIDER: 1,
    TEXTBOX: 2,
    SELECTBOX: 3,
    CHECKBOX: 4,
    COLOR: 5,
}

const Setting = class {
    constructor(parent, name, type, visibilityDependency) {
        this.parent = parent
        this.name = name
        this.type = type
        this.visibilityDependency = visibilityDependency
    }
}
const ComboboxSetting = class extends Setting {
    constructor(parent, name, acceptableValues, visibilityDependency) {
        super(parent, name, SettingType.COMBOBOX, visibilityDependency)
        this.acceptableValues = acceptableValues
    }
}
const SliderSetting = class extends Setting {
    constructor(
        parent,
        name,
        minValue,
        maxValue,
        increment,
        visibilityDependency
    ) {
        super(parent, name, SettingType.SLIDER, visibilityDependency)
        this.minValue = minValue
        this.maxValue = maxValue
        this.increment = increment
    }
}
const TextboxSetting = class extends Setting {
    constructor(parent, name, visibilityDependency) {
        super(parent, name, SettingType.TEXTBOX, visibilityDependency)
    }
}
const CheckboxSetting = class extends Setting {
    constructor(parent, name, visibilityDependency) {
        super(parent, name, SettingType.CHECKBOX, visibilityDependency)
    }
}
const SelectboxSetting = class extends Setting {
    constructor(parent, name, acceptableValues, visibilityDependency) {
        super(parent, name, SettingType.SELECTBOX, visibilityDependency)
        this.acceptableValues = acceptableValues
    }
}
const ColorSetting = class extends Setting {
    constructor(parent, name, visibilityDependency) {
        super(parent, name, SettingType.COLOR, visibilityDependency)
    }
}
const _Module = class {
    constructor(name, description, settings) {
        this.name = name
        this.description = description
        this.settings = settings
    }
}
const settings = new Map()
const moduleRegistry = []
const getNextSlider = sliderId => ({ h: "s", s: "l", l: "h" } [sliderId])
const _checkboxChecked = setting => $(`#${setting} > .checkbox-value`).hasClass("checkbox-checked")
const _getSliderValue = setting =>  $(`#${setting} > .real-slider`).val()
const _getSelectboxValue = setting => $(`#${setting} > .selectbox-value`).text()
const _selectboxHasItem = (setting, item) => $(`#${setting} > .combobox-items > li:contains('${item}')`).hasClass("selected-item") // Hack: 这种被我认定为无害的所以没改
const expandHandler = module => { // Hack: 什么？上一行注释没看懂?你会明白的，记得向下看。
    const $growDiv = $(`#${module}-module > .module-settings-wrapper`)
    const $expander = $(`#${module}-module > .module-header > .module-expand`)
    if ($growDiv.height()) {
        $growDiv.height(0)
        $expander.css("transform", "rotateX(0deg)")
    }
    else {
        const $wrapper = $(`#${module}-module > .module-settings-wrapper > .module-settings`)
        $growDiv.height($wrapper.height())
        $expander.css("transform", "rotateX(180deg)")
    }
    return false
}

const forceUpdate = module => {
    const $growDiv = $(`#${module}-module > .module-settings-wrapper`)
    const $wrapper = $(`#${module}-module > .module-settings-wrapper > .module-settings`)
    $growDiv.height($wrapper.height())
}
const toggleModule = module => {
    const $moduleHeader = $(`#${module}-module > .module-header`)
    if ($moduleHeader.hasClass("toggled-module")) {
        $moduleHeader.removeClass("toggled-module")
        return false
    }
    else {
        $moduleHeader.addClass("toggled-module")
        return true
    }
}
const registerModules = modules => {
    log("Registering modules")

    // Note: Need no AJAX.
    modules.forEach(category => {
        renderCategory(category)
        category.children.forEach(module => {
            const sets = new Map()
            moduleRegistry.push(module)
            if ("settings" in module)
                module.settings.forEach(setting => {
                    const settingName = setting.name
                    const visibilityDependency =
                        "visibilityDependency" in setting
                            ? setting.visibilityDependency
                            : alwaysVisibile
                    switch (SettingType[setting.type]) {
                    case SettingType.SELECTBOX:
                        setting = new SelectboxSetting(
                            module,
                            setting.displayName,
                            setting.acceptableValues,
                            visibilityDependency
                        )
                        break
                    case SettingType.COMBOBOX:
                        setting = new ComboboxSetting(
                            module,
                            setting.displayName,
                            setting.acceptableValues,
                            visibilityDependency
                        )
                        break
                    case SettingType.CHECKBOX:
                        setting = new CheckboxSetting(
                            module,
                            setting.displayName,
                            visibilityDependency
                        )
                        break
                    case SettingType.TEXTBOX:
                        setting = new TextboxSetting(
                            module,
                            setting.displayName,
                            visibilityDependency
                        )
                        break
                    case SettingType.SLIDER:
                        setting = new SliderSetting(
                            module,
                            setting.displayName,
                            setting.minValue,
                            setting.maxValue,
                            setting.increment,
                            visibilityDependency
                        )
                        break
                    case SettingType.COLOR:
                        setting = new ColorSetting(
                            module,
                            setting.displayName,
                            visibilityDependency
                        )
                        break
                    }
                    settings.set(module.name + "/" + settingName, setting)
                    sets.set(settingName, setting)
                })
            renderModule(category, module)
        })
    })
    renderTextEditor()

    log("Rendered modules")

    registerHandlers()
}
const toggleClass = (element, name) => {
    if (element.hasClass(name)) {
        element.removeClass(name)
        return false
    }
    else {
        element.addClass(name)
        return true
    }
}
const renderTextEditor = () => {
    $(".clickgui").append(`<div class="textbox-editor"><textarea></textarea></div>`)
}
const renderCategory = category => {
    const $panel = $(`
        <div id="${ category.name }-tab" class="panel">
            <div class="panel-header">
                <span class="panel-title">${ category.displayName }</span>
                ${ /* Kill: Have no images now. */ "" &&
                    `<img class="panel-icon" loading="lazy" src="?.png" />` }
                <span class="panel-help">?</span>
            </div>
            <div class="panel-elements">
            </div>
        </div>
    `).appendTo($(".clickgui"))
    $panel
        .find(".panel-help")
        .on("click", () => $panel.toggleClass("helping-panel"))
}
const renderModule = (category, module) => {
    const hasSetting = module.settings.length > 0
    $(`#${ category.name }-tab > .panel-elements`).append(`
        <div id="${ module.name }-module" class="module">
            <div class="module-header" data-desc="${ module.description }">
                <span class="module-title">${ module.name }</span>
                ${ hasSetting ? `<span class="module-expand">v</span>` : "" }
            </div>
            <div class="module-settings-wrapper">
                ${ hasSetting ? renderSettings(module) : "" }
            </div>
        </div>
    `)

    const $header = $(`#${ module.name }-module > .module-header`)
    if (hasSetting)
        $header.contextmenu(() => expandHandler(module.name))

    if (module.rawName[0] === "@") $header.addClass("locked-module")
    else {
        if (sto[module.rawName].on) toggleModule(module.name) // Sto: load
        $header.on("click", () => {
            sto[module.rawName].on = toggleModule(module.name) // Sto: save
        })
    }
}
const renderSettings = module => {
    let html = `<div class="module-settings">`
    module.settings.forEach(setting => {
        const val = sto[module.rawName][setting.name]
        html += `
            <div
                id="${ module.name }/${ setting.name }"
                class="setting ${ setting.type.toLowerCase() }-setting"
                ${ setting.description?.map((s, k) => `data-desc-${k}="${s}"`).join(" ") ?? "" }
            >
        `
        /* Hack: 这个地方用了xxx/xx的id形式，可能会导致不能用
Hack: 有毒是吧...那我去改成getElementById..底下有注释*/
        switch (SettingType[setting.type]) {
        case SettingType.SELECTBOX:
            html += `
				<span class="setting-title">${ setting.displayName }</span>
				<span class="selectbox-value">${ val || setting.acceptableValues[0] /* Sto: load */ }</span>
            `
            break
        case SettingType.COMBOBOX:
            html += `
				<div class="combobox-wrapper">
					<span class="combobox-title">${ setting.displayName }</span>
				</div>
				<ul class="combobox-items collapsed-combobox">
					${ setting.acceptableValues.map(v => `<li>${v}</li>`).join("\n") }
				</ul>
            `
            break
        case SettingType.CHECKBOX:
            html += `
				<span class="setting-title">${ setting.displayName }</span>
				<div class="checkbox-value ${ val ? "checkbox-checked" : "" /* Sto: load */ }"></div>
            `
            break
        case SettingType.TEXTBOX:
            /* Note: Avoid undefined placeholder. Support extending to text editor. */
            html += `
				<span class="setting-title">${ setting.displayName }</span>
				<span class="textbox-at">@</span>
				<textarea class="textbox" rows="1" style="font-family: ${sto["code-block-ex"].copy_code_font}">${ val || "" /* Sto: load */  }</textarea>
            `
            break
        case SettingType.SLIDER:
            html += `
				<input type="range" class="display-slider"
					min="${ setting.minValue }" max="${ setting.maxValue }" step="${ setting.increment }"
					value="${ val || setting.minValue }" disabled
				/>
				<input type="range" class="real-slider"
					min="${ setting.minValue }" max="${ setting.maxValue }" step="${ setting.increment }"
					value="${ val || setting.minValue }"
				/>
				<div class="slider-value-holder">
					<span class="setting-title">${ setting.displayName }</span>
					<span class="slider-value">${ val || setting.minValue /* Sto: load */ }</span>"
				</div>
            `
            break
        case SettingType.COLOR:
            html += `
				<div class="sliders" slider="h">
					<input type="range" class="color-slider h-slider" min="1" max="360" disabled />
					<input type="range" class="real-color-slider real-h-slider" min="0" max="360" slider="h" />
					<input type="range" class="color-slider s-slider disabled-color-slider" min="0" max="100" disabled />
					<input type="range" class="real-color-slider real-s-slider disabled-color-slider" min="0" max="100" slider="s" />
					<input type="range" class="color-slider l-slider disabled-color-slider" min="0" max="100" disabled />
					<input type="range" class="real-color-slider real-l-slider disabled-color-slider" min="0" max="100" slider="l" />
					<span class="setting-title">${ setting.displayName }</span>
				</div>
            `
            break
        }
        html += `</div>`
    })
    return html
}

const renderMessages = () => {
    $(`<div class="messages"></div>`).appendTo($(".clickgui"));
    [ ...sto["@dash-board"].msg.queue ].forEach(m => msg(m.text, m.id))
}

const renderSidebar = () => {
    const $bar = $(`<div class="sidebar"></div>`).prependTo($(".clickgui"))

    const op = {
        sync: () => {
            sto = window.exlg.TM_dat.sto = window.exlg.TM_dat.reload_dat()
            msg("Storage is synchronized.")
        },
        upd: () => {
            window.exlg.mod.execute("^update")
        }
    }

    for (const n in op) {
        $(`
            <div id="sidebar-${n}">
                <p class="sidebar-title">${n}</p>
            </div>
        `)
            .appendTo($bar)
            .on("click", op[n])
    }
}

const refreshSettingVisiblity = module => {
    if ("settings" in module)
        module.settings.forEach(setting =>
            $(document.getElementById(`${ module.name }/${ setting.name }`))[
                eval(setting.visibilityDependency) === false ? "addClass" : "removeClass"
            ] ("setting-disabled")
        )
}
const refreshSettings = module => {
    refreshSettingVisiblity(module)
    forceUpdate(module.name)
}
const _getHSLColorFromSetting = setting => {
    const h = $(document.getElementById(setting)).children(`.sliders`).children(`.real-h-slider`).val()
    const s = $(document.getElementById(setting)).children(`.sliders`).children(`.real-s-slider`).val()
    const l = $(document.getElementById(setting)).children(`.sliders`).children(`.real-l-slider`).val()
    return `hsl(${h}, ${s}, ${l})` // Hack: 动过了
}
const getSettingFromChild = $e => {
    const $setting = $e.is(".setting") ? $e : $e.parents(".setting")
    const id = $setting.attr("id")
    const setting = settings.get(id)
    const moduleName = setting.parent.rawName
    const settingName = id.split("/")[1]
    return {
        id, moduleName, settingName, setting,
        refreshSetting: () => refreshSettings(setting.parent)
    }
}
const registerHandlers = () => {
    moduleRegistry.forEach(refreshSettingVisiblity)

    $(".real-slider").on("input", e => {
        const $that = $(e.currentTarget)
        const { id, moduleName, settingName, refreshSetting } = getSettingFromChild($that)
        $(document.getElementById(id)).children(`.display-slider`).val($that.val())
        $(document.getElementById(id)).children(`.slider-value-holder`).children(`.slider-value`).html($that.val()) // Note: 改了
        refreshSetting()

        sto[moduleName][settingName] = + $that.val() // Sto: save
    })

    // TODO
    // $(".combobox-items > li").on("click", e => {
    //     const $e = $(e.target)
    //     const { id, moduleName, settingName, refreshSetting } = getSettingFromChild($e)
    //     toggleClass($e, "selected-item")
    //     refreshSettings(setting.parent)
    // })
    // $(".combobox-wrapper").on("click", e => {
    //     const id = $(e.currentTarget).parent().attr("id")
    //     toggleClass($(document.getElementById(id)).children(`.combobox-items`), "collapsed-combobox")
    //     const module = $(e.currentTarget).parent().parent().parent().parent().attr("id").split("-")[0]
    //     forceUpdate(module)
    // })

    $(".selectbox-value").on("click", e => {
        const $that = $(e.currentTarget)
        const { moduleName, settingName, setting, refreshSetting } = getSettingFromChild($that)

        let i = setting.acceptableValues.indexOf($that.text())
        i = ++i === setting.acceptableValues.length ? 0 : i
        const val = setting.acceptableValues[i]
        $that.text(val)
        refreshSetting()

        sto[moduleName][settingName] = val // Sto: save
    })

    $(".textbox").on("change", e => {
        const $that = $(e.currentTarget)
        const { moduleName, settingName } = getSettingFromChild($that)

        sto[moduleName][settingName] = $that.val() // Sto: save
    })
    $(".textbox-at").on("click", e => {
        const $at = $(e.currentTarget)
        const $text = $at.next(".textbox")
        const $editor = $(".textbox-editor > textarea")

        if (toggleClass($at, "textbox-extended")) {
            $text.attr("disabled", true)
            $editor.val($text.val())
        }
        else {
            $text.attr("disabled", false)
            $text.val($editor.val()).change()
        }
    })

    $(".checkbox-value").parent().on("click", e => {
        // Note: Larger clicking area.
        const $that = $(e.currentTarget)
        const { moduleName, settingName, refreshSetting } = getSettingFromChild($that)

        const $val = $that.children(".checkbox-value")
        const val = toggleClass($val, "checkbox-checked")
        refreshSetting()

        sto[moduleName][settingName] = val // Sto: save
    })

    $(".sliders").contextmenu(e => {
        const id = $(e.target).parent().parent().attr("id")
        const slider = $(e.target).parent().attr("slider")
        const next = getNextSlider(slider)
        $(e.target).parent().attr("slider", next)
        $(document.getElementById(id)).children(`.sliders`).children(`.${slider}-slider`).addClass("disabled-color-slider")
        $(document.getElementById(id)).children(`.sliders`).children(`.real-${slider}-slider`).attr("disabled", true).addClass("disabled-color-slider")
        $(document.getElementById(id)).children(`.sliders`).children(`.${next}-slider`).removeClass("disabled-color-slider")
        $(document.getElementById(id)).children(`.sliders`).children(`.real-${next}-slider`).attr("disabled", false).removeClass("disabled-color-slider")

        return false
    })

    // TODO
    $(".real-color-slider").on("input", e => {
        const that = e.currentTarget
        const slider = $(that).attr("slider")
        const id = $(that).parent().parent().attr("id")
        $(document.getElementById(id)).children(`.sliders`).children(`.${slider}-slider`).val(that.value)
        if (slider === "h") {
            $(document.getElementById(id)).children(`.sliders`).children(`.s-slider`).css("background-color", `hsl(${that.value}, 100%, 50%)`)
            $(document.getElementById(id)).children(`.sliders`).children(`.l-slider`).css("background-color", `hsl(${that.value}, 100%, 50%)`)
        }
    })
    $(".real-h-slider").each((_, that) => {
        const id = $(that).parent().parent().attr("id")
        $(document.getElementById(id)).children(`.sliders`).children(`.s-slider`).css("background-color", `hsl(${that.value}, 100%, 50%)`)
        $(document.getElementById(id)).children(`.sliders`).children(`.l-slider`).css("background-color", `hsl(${that.value}, 100%, 50%)`)
    })
}

window.novogui = {
    log,
    msg,
    init(modules) {
        window.novogui._ = modules
        sto = window.exlg.TM_dat.sto

        $(".clickgui").attr("data-lang", [ "en", "zh" ].indexOf(sto["@dash-board"].lang))
        registerModules(modules)
        renderMessages()
        renderSidebar()
    }
}

