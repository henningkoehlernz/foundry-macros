// identify trick attack feat and target
const feat = actor.items.find(i => i.name == "Trick Attack (Ex)");
const target = canvas.tokens?.placeables.find((t) => t.id == game.user.targets.ids[0]);
if (!feat) return ui.notifications.warn('Missing Trick Attack Feature');
if (!target) return ui.notifications.warn('No Target Selected');

const dc = 20 + (target?.actor.system.details.cr ?? target?.actor.system.details.level.value);
const opLvl = actor.system.classes.operative?.levels ?? 0;

// get skill used for trick attack from feat bonus
let skillId = feat.system.modifiers.find(m => m.effectType == "skill")?.valueAffected;
if (!skillId) {
    skillId = ['blu','int','ste','acr','sen','sur','com','sle'].reduce((best,skill) => skillMod(skill) > skillMod(best) ? skill : best, 'ste');
    ui.notifications.info(`Trick attack has no skill modifier, using ${skillId}`);
}
if (actor.system.skills[skillId].ranks == 0)
    ui.notifications.warn(`Trick attack skill (${skillId}) has no ranks`);

// create dialog with weapon options
let d = new InputDialog('Trick Attack');
let op_weapons = actor.items.filter(item => item.type == 'weapon' && (item.system.properties.operative || item.system.weaponType == 'smallA') && item.system.equipped);
d.addSelect('Weapon', 'weapon', op_weapons.map(w => w.name).sort());
if (actor.items.find(i => i.name == "Debilitating Trick (Ex)")) {
    let options = ['flat-footed', 'off-target', 'bleeding'];
    //options = options.filter(con => !target.actor.system.conditions[con]);
    d.addSelect('Debilitating Trick', 'trick', options);
}
d.addCheckbox('Take 10', 'take10', opLvl >= 7);

d.render(async (data) => {
    const weapon = actor.items.find(i => i.name === data.weapon);
    const eac = weapon.system.actionTarget == 'eac';

    // skill check
    let skillMsg = `Trick Attack (${skillId}): `;
    await feat.update({"system.isActive": true}); // activate to apply skill bonus for trick attack
    let skillModifier = skillMod(skillId);
    let rollResult = 0;
    if (data.take10) {
        rollResult = 10 + skillModifier;
        skillMsg += `Take 10 = ${rollResult}`;
    } else {
        let roll = await (new Roll(`1d20+${skillModifier}`)).evaluate();
        rollResult = roll.total;
        skillMsg += AttackTable.createInlineRoll(roll);
    }
    const success = (dc <= rollResult);
    chat(skillMsg + "<br>Skill check " + (success ? "succeeded" : "failed"));
    if (!success) {
        await feat.update({"system.isActive": false});
    }

    // attack & damage
    let attackRoll = 0;
    Hooks.once('attackRolled', function (data) {
        attackRoll = data.roll.total;
    });
    await weapon.rollAttack(); // triggers attackRolled hook
    const flatfooted = target.actor.system.conditions['flat-footed'];
    const ac = (eac ? target.actor.system.attributes.eac.value : target.actor.system.attributes.kac.value) + (success && !flatfooted ? -2 : 0);
    const hit = attackRoll >= ac;
    let msg = (hit ? "Hits " : "Misses ") + (success || flatfooted ? "flatfooted " : "") + (eac ? "EAC" : "KAC") + " of " + target.name + ".";
    if (hit)
    {
        if (success && data.trick) {
            msg += "<br>Debilitating Trick: Target is " + data.trick + ".";
        }
        chat(msg);
        await weapon.rollDamage();
    } else {
        chat(msg);
    }

    await feat.update({"system.isActive": false});
});

function chat(message) {
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor:actor}),
        content: message,
        lang: "common", // for use with Polyglot module
    });
}

function skillMod(skill) {
    return actor.system.skills[skill].mod;
}
