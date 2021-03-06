
// Custom UI code

(function () {
    $.Msg( "The Auto Chess custom UI just loaded! ---------------------------------------------------------------------------------------------------------------------" );
})();

// Params

var DISPLAY_TIER = true;
var DISPLAY_DRAW_PROB = true;

// Userful data

var color_gradient = ["#05ef14","#0aee13","#0fec13","#14ea13","#19e912","#1ee712","#23e512","#28e411","#2ce211","#31e010","#36df10","#3bdd10","#40db0f","#45da0f","#4ad80f","#4fd60e","#54d50e","#59d30e","#5ed10d","#63d00d","#68ce0d","#6dcc0c","#72cb0c","#77c90c","#7cc70b","#80c60b","#85c40a","#8ac20a","#8fc10a","#94bf09","#99bd09","#9ebc09","#a3ba08","#a8b808","#adb708","#b2b507","#b7b307","#bcb207","#c1b006","#c6ae06","#cbad06","#d0ab05","#d4a905","#d9a804","#dea604","#e3a404","#e8a303","#eda103","#f29f03","#f79e02","#fc9902","#fc9602","#fb9302","#fb9002","#fb8d02","#fb8a02","#fb8702","#fa8402","#fa8102","#fa7e02","#fa7b02","#fa7802","#fa7502","#f97201","#f96f01","#f96c01","#f96901","#f96601","#f86301","#f86001","#f85d01","#f85a01","#f85701","#f75401","#f75101","#f74e01","#f74b01","#f74801","#f64501","#f64201","#f63f01","#f63c01","#f63901","#f53601","#f53301","#f53001","#f52d01","#f52a01","#f52701","#f42400","#f42100","#f41e00","#f41b00","#f41800","#f31500","#f31200","#f30f00","#f30c00","#f30900","#f20600","#f20300"];

// Functions

function find_dota_hud_element(id){
    var hudRoot;
    var panel;
    for(panel=$.GetContextPanel();panel!=null;panel=panel.GetParent()){
        hudRoot = panel;
    }
    var comp = hudRoot.FindChildTraverse(id);
    return comp;
}

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

function add(accumulator, a) {
    return accumulator + a;
}

/*START-DRAWSTAT*/  

function getCurrentChamps() {

    //check if enemy is alive after a battle round
    if ( enemies_steam_ids) {
        for ( var i in enemies_steam_ids ) {
            //is dead, remove it
            if ( !Entities.IsAlive(enemies_steam_ids[i].entity) ) {
                enemies_steam_ids[i].is_dead = true;
            }
        }
    }

    var user_list = [];
    var enemy_list = [];

    $.Each(Entities.GetAllEntitiesByClassname('npc_dota_creature'), function(entity) {
        var unit_name = Entities.GetUnitName(entity);
        var unit_is_alive = Entities.IsAlive(entity);
        var unit_team = Entities.GetTeamNumber(entity);

        if ( !unit_name.match(/chess/) || !unit_is_alive ) {
            return;
        }

        if ( local_player_team == unit_team ) {
            user_list.push(unit_name);
        } else {
            //check if enemy still exists and is alive
            if ( !enemies_steam_ids || !enemies_steam_ids[unit_team] ) {
                return;
            }
            enemy_list.push(unit_name);
        }
    });

    var hero_list = user_list.concat(enemy_list);
    var hero_one_star_list = [];

    $.Each(hero_list, function(item) {
        var hero_det = hero_dict[item];

        if (hero_det['level'] == 1) {
            hero_one_star_list.push(hero_det['name']);
        } else if (hero_det['level'] == 2) {
            for(var i=0; i < 3; i++){
                hero_one_star_list.push(hero_det['name']);
            }            
        } else {
            for(var i=0; i < 9; i++){
                hero_one_star_list.push(hero_det['name']);
            }            
        }

    });

    var counts = {};

    for (var i = 0; i < hero_one_star_list.length; i++) {
        var num = hero_one_star_list[i];
        counts[num] = counts[num] ? counts[num] + 1 : 1;
    }

    //output counts in console with sorted.
    var view_counts = Object.keys(counts).map(function(key){
        return [key, counts[key]]
    });
    view_counts.sort(function(first, second) {
        return second[1] - first[1];
    });

    
    var user_hero_name_list = [];
    $.Each(user_list, function(item){
        user_hero_name_list.push(hero_dict[item]['name']);
    })
    $.Msg(user_hero_name_list.join(','));
    for (var k in view_counts) {
        var my_hero_flag = '';
        if(user_hero_name_list.includes(view_counts[k][0])) {
            my_hero_flag = '[*]';
        }
        $.Msg(my_hero_flag +view_counts[k][0] + ' : ' + view_counts[k][1])
    }

    return counts
};

function get_total_size_of_pool(hero_counts_input, courier_level_input) {
    var size_cost_pool = {1 : 0, 2 : 0, 3 : 0, 4 : 0, 5 : 0};

    if (first_time) {
        size_cost_pool_max = {1 : 0, 2 : 0, 3 : 0, 4 : 0, 5 : 0};
        $.Each(hero_id_list, function(item) {
            if (hero_not_avail.indexOf(item) >= 0 || hero_out_of_pool.indexOf(item) >= 0) {
                //pass 
            } else {
                var tmp_cost = hero_dict[item]['cost'];
                var tmp_hero_pool = hero_pool_counts[tmp_cost];

                size_cost_pool[tmp_cost] = size_cost_pool[tmp_cost] + tmp_hero_pool;

                // add to max pool
                size_cost_pool_max[tmp_cost] = size_cost_pool_max[tmp_cost] + tmp_hero_pool;
            }
        }); 
    } else {
        // $.Each(hero_id_list, function(item) {
        //     var tmp_ele = find_dota_hud_element(item);
        //     if (tmp_ele && hero_out_of_pool.indexOf(item) == -1) {
        //         var tmp_cost = hero_dict[item]['cost'];
        //         var tmp_hero_pool = hero_pool_counts[tmp_cost];
        //         var champ_name = hero_dict[item]['name'];
        
        //         if (champ_name in hero_counts_input) {
        //             var hero_in_play = hero_counts_input[champ_name];
        //         } else {
        //             var hero_in_play = 0
        //         }

        //         size_cost_pool[tmp_cost] = size_cost_pool[tmp_cost] + (tmp_hero_pool - hero_in_play);
        //     } else {
        //         $.Msg('find item pass')                
        //     }
        // });
        // the method above  doesn't work.
        $.Each(hero_id_list, function(item) {
            // $.Msg(item + '' + hero_dict[item]['name']);
            var tmp_ele = hero_dict[item]['name'] ? true : false;
            if (tmp_ele && hero_out_of_pool.indexOf(item) == -1) {
                var tmp_cost = hero_dict[item]['cost'];
                var tmp_hero_pool = hero_pool_counts[tmp_cost];
                var champ_name = hero_dict[item]['name'];
        
                if (champ_name in hero_counts_input) {
                    var hero_in_play = hero_counts_input[champ_name];
                } else {
                    var hero_in_play = 0
                }

                size_cost_pool[tmp_cost] = size_cost_pool[tmp_cost] + (tmp_hero_pool - hero_in_play);
            }
        });
    }
    $.Msg('size_cost_pool_func:');
    for (var k in size_cost_pool) {
        if (size_cost_pool[k] == 0) {
            size_cost_pool[k] = size_cost_pool_max[k]
        } 
        $.Msg(k + ' : ' + size_cost_pool[k]);
    }

    return size_cost_pool; //size_total_pool
}

function calculate_draw_prop(champ_input, hero_counts_input, courier_level_input, size_cost_pool_input) {
    if (!courier_level_input) {
        courier_level_input = 1
    }

    var champ_name = hero_dict[champ_input]['name'];
    var tmp_cost = hero_dict[champ_input]['cost'];
    var tmp_hero_pool = hero_pool_counts[tmp_cost];

    var size_hero_cost_pool = size_cost_pool_input[tmp_cost];

    if (champ_name in hero_counts_input) {
        var hero_in_play = hero_counts_input[champ_name];
    } else {
        var hero_in_play = 0
    }

    var num_hero_avail = tmp_hero_pool - hero_in_play;
    var num_bad_draws = size_hero_cost_pool - num_hero_avail;

    var good_cost_prob = cost_draw_probs_by_level[courier_level_input][tmp_cost];
    var bad_cost_prob = 1 - good_cost_prob;

    var prop_at_least_one = 1 - ((bad_cost_prob + (good_cost_prob * (num_bad_draws / size_hero_cost_pool))) * 
                                (bad_cost_prob + (good_cost_prob * ((num_bad_draws - 1) / (size_hero_cost_pool - 1)))) * 
                                (bad_cost_prob + (good_cost_prob * ((num_bad_draws - 2) / (size_hero_cost_pool - 2)))) * 
                                (bad_cost_prob + (good_cost_prob * ((num_bad_draws - 3) / (size_hero_cost_pool - 3)))) * 
                                (bad_cost_prob + (good_cost_prob * ((num_bad_draws - 4) / (size_hero_cost_pool - 4)))));

    // Define color

    var perc_color = '#ffffff';

    // Color pallettes:

    var c_p_dict = {'blue' : ['#3bbe2c', '#2ca158', '#1e8483', '#0f67af', '#004adb'], 'red' : ['#62b70c', '#7a9219', '#936e25', '#ab4932', '#c3253e']};
    var c_green = '#4adb00'


    var color_list;

    var cost_max_pool = size_cost_pool_max[tmp_cost];
    var base_perc = tmp_hero_pool / cost_max_pool;
    var naive_perc = num_hero_avail / size_hero_cost_pool;
    var dif_perc = naive_perc - base_perc;

    //$.Msg(champ_name, ' ', cost_max_pool, ' ', base_perc, ' ', naive_perc, ' ', tmp_hero_pool, ' ', num_hero_avail, ' ', size_hero_cost_pool, ' ', cost_max_pool)

    if (dif_perc == 0) {
        perc_color = c_green;
    } else {
        if (dif_perc > 0) {
            color_list = 'blue'
        } else {
            color_list = 'red'
        }
        var abs_dif = Math.abs(dif_perc) / base_perc;

        if (abs_dif <= 0.2) {
            perc_color = c_p_dict[color_list][0];
        } else if (abs_dif <= 0.4) {
            perc_color = c_p_dict[color_list][1];
        } else if (abs_dif <= 0.6) {
            perc_color = c_p_dict[color_list][2];
        } else if (abs_dif <= 0.8) {
            perc_color = c_p_dict[color_list][3];
        } else {
            perc_color = c_p_dict[color_list][4];
        }
    }

    var output = Math.round(prop_at_least_one * 100 * 10) / 10;   

    if (champ_name == 'Io' || champ_name == '精灵守卫') {
        output = 1.5;
        perc_color ='#ffffff';
    }

    return [output, perc_color]  ;
}

//Update display draw_prop method in Chess board.
function update_list_draw_prop(hero_counts_input, size_cost_pool_input) {
    for(var cost = 1; cost <=5; cost ++) {
        tmp_eles = find_dota_hud_element('chess_board').FindChildrenWithClassTraverse('color-cost'+cost);
        if (tmp_eles) {
            for(var i in tmp_eles) {
                var item_name = tmp_eles[i].text.replace('★', '').trim();
                item_name = item_name.substring(item_name.indexOf("%") + 1);
                // $.Msg(item_name);
                var item = '';
                for(var k in hero_dict) {
                    if (hero_dict[k]['name'] == item_name) {
                        item = k;
                        break;
                    }
                }
                if(item) {
                    courier_level_round = Entities.GetLevel(courier_id);
                    var tmp_ret = calculate_draw_prop(item, hero_counts_input, courier_level_round, size_cost_pool_input);
                    var hero_perc_avail = tmp_ret[0].toString();
                    var hero_in_play_str = '';
                    if (hero_counts_input && hero_counts_input[item_name]) {
                        hero_in_play_str = '{' + hero_counts_input[item_name].toString() + '}';
                    }
                    tmp_eles[i].text = hero_in_play_str + hero_perc_avail + '%' + item_name;
                }
            }
        }
    }
}

/*END-DRAWSTAT*/ 

// Data inputs

var hero_not_avail = ['chess_sf', 'chess_lich', 'chess_kunkka'];
var hero_out_of_pool = ['chess_io'];

var size_cost_pool_max = {1 : 0, 2 : 0, 3 : 0, 4 : 0, 5 : 0}

var eng_to_cn = {
    'Abaddon': '死亡骑士', //abaddon
    'Alchemist': '炼金术士', //ga
    'Anti-mage': '敌法师', //am
    'Axe': '斧王', //axe
    'Batrider': '蝙蝠骑士', //bat
    'Beastmaster': '兽王', //bm
    'Bounty Hunter': '赏金猎人', //bh
    'Chaos Knight': '混沌骑士', //ck
    'Clockwerk': '发条技师', //clock
    'Crystal Maiden': '水晶室女', //cm
    'Death Prophet': '死亡先知', //dp
    'Disruptor': '干扰者', //disruptor
    'Doom': '末日使者', //doom
    'Dragon Knight': '龙骑士', //dk
    'Drow Ranger': '卓尔游侠', //dr
    'Enchantress': '魅惑魔女',  //eh
    'Enigma': '谜团', //enigma
    'Furion': '先知', //fur
    'Gyrocopter': '矮人直升机', //gyro
    'Io' : '精灵守卫', //io
    'Juggernaut': '剑圣', //jugg
    'Keeper of the Light': '光之守卫', //light
    'Kunkka': '海军上将', //kunkka
    // 'Lich': '巫妖', //lich
    'Lina': '秀逗魔导士', //lina
    'Lone Druid': '利爪德鲁伊', //ld
    'Luna': '月之骑士',  //luna
    'Lycan': '狼人', //lyc
    'Mars': '天界战神', //mars
    'Medusa': '蛇发女妖', //medusa
    'Mirana': '月之女祭司', //pom
    'Morphling': '变体精灵', //morph
    'Necrophos': '死灵法师', //nec
    'Ogre Magi': '食人魔魔法师', //om
    'Omniknight': '全能骑士', //ok
    'Phantom Assassin': '幻影刺客', //pa
    'Puck': '精灵龙', //puck
    'Queen of Pain': '痛苦女王', //qop
    'Razor': '闪电幽魂', //razor
    'Shadow Fiend': '影魔', //sf
    'Shadow Shaman': '暗影萨满', //ss
    'Slardar': '鱼人守卫', //slardar
    'Sniper': '狙击手', //sniper
    'Techies': '地精工程师', //tech
    'Templar Assassin': '圣堂刺客', //ta
    'Terrorblade': '灵魂守卫', //tb
    'Tidehunter': '潮汐猎人', //th
    'Timbersaw': '伐木机', //shredder
    'Tinker': '修补匠', //tk
    'Tiny': '小小', //tiny
    'Treant Protector': '树精卫士', //tp
    'Troll Warlord': '巨魔战将', //troll
    'Tusk': '巨牙海民', //tusk
    'Venomancer': '剧毒术士', //veno
    'Viper': '冥界亚龙', //viper
    'Windranger': '风行者', //wr
    'Witch Doctor': '巫医', //wd
    'Zeus': '众神之王', //zeus
    'Grimstroke': '天涯墨客',
    'Dazzle': '暗影牧师', //dazzle
    'Sven' : '流浪剑客', //sven
    'Winter Wyvern': '寒冬飞龙', //ww

    'Snapfire': '电炎绝手', //snap
    'Huskar':'神灵武士', //huskar
    'Bloodseeker': '血魔', //bs
    'Sand King': '沙王', //sk
    'Slark': '鱼人夜行者', //slark
    'Invoker': '祈求者', //kael
    'Visage':'死灵飞龙', //visage
    'Rubick': '大魔导师', //rubick
    'Pudge': '屠夫', //pudge
    'Lion': '恶魔巫师', //lion
    'Grimstroke': '天涯墨客', //gs
    'Oracle': '神谕者', //oracle
    'Nyx Assassin': '司夜刺客', //na
    'Broodmother': '育母蜘蛛', //br
    'Legion Commander': '军团指挥官', //lc
    'Chen': '上帝之手', //chen
    'Jakiro': '双头龙', //thd
    'Dark Willow': '邪影芳灵', //dw
    'Brewmaster': '熊猫酒仙', //brew
    'Ember Spirit': '灰烬之灵', //ember
    'Storm Spirit': '风暴之灵', //storm
  
    //'Riki' 3
    //'fv'3
    //'mk' 5
    

}

var tier_dict = {
    'Abaddon': 'C',
    'Alchemist': 'B',
    'Anti-mage': 'B',
    'Axe': 'D',
    'Batrider': 'D',
    'Beastmaster': 'B',
    'Bounty Hunter': 'A',
    'Chaos Knight': 'C',
    'Clockwerk': 'A',
    'Crystal Maiden': 'B',
    'Dazzle': 'B',
    'Death Prophet': 'C',
    'Disruptor': 'C',
    'Doom': 'A',
    'Dragon Knight': 'B',
    'Drow Ranger': 'B',
    'Enchantress': 'D',
    'Enigma': 'S',
    'Furion': 'D',
    'Gyrocopter': 'B',
    'Io': 'S',
    'Juggernaut': 'C',
    'Keeper of the Light': 'B',
    'Kunkka': 'A',
    'Lina': 'C',
    'Lone Druid': 'S',
    'Luna': 'C',
    'Lycan': 'B',
    'Mars': 'C',
    'Medusa': 'S',
    'Mirana': 'C',
    'Morphling': 'C',
    'Necrophos': 'A',
    'Ogre Magi': 'E',
    'Omniknight': 'C',
    'Phantom Assassin': 'B',
    'Puck': 'D',
    'Queen of Pain': 'C',
    'Razor': 'A',
    'Shadow Fiend': 'A',
    'Shadow Shaman': 'D',
    'Slardar': 'C',
    'Sniper': 'C',
    'Techies': 'B',
    'Templar Assassin': 'B',
    'Terrorblade': 'C',
    'Tidehunter': 'S',
    'Timbersaw': 'A',
    'Tinker': 'C',
    'Tiny': 'S',
    'Treant Protector': 'B',
    'Troll Warlord': 'B',
    'Tusk': 'B',
    'Venomancer': 'C',
    'Viper': 'D',
    'Windranger': 'B',
    'Witch Doctor': 'C',
    'Zeus': 'A',

    'Snapfire':'-',
    'Huskar':'-',
    'Bloodseeker':'-',
    'Sand King':'-',
    'Invoker':'-',
    'Sven': '-',
    'Visage': '-',
    'Winter Wyvern': '-',
    'Slark': '-',
    'Rubick': '-',
    'Pudge': '-',
    'Lion': '-',
    'Grimstroke': '-',
    'Oracle': '-',
    'Nyx Assassin': '-',
    'Broodmother': '-',
    'Legion Commander': '-',
    'Chen': '-',
    'Jakiro': '-',
    'Dark Willow': '-',
    'Brewmaster': '-',
    'Storm Spirit': '-',
    'Ember Spirit': '-'
    // 'Lich':'-',


};

// Death Prophet (5), Treant (3), Mirana (2), Crystal Maiden (2)  might be wrong cost!

var hero_dict = {
'chess_abaddon': {'cost': 2, 'level': 1, 'name': 'Abaddon'},
'chess_abaddon1': {'cost': 2, 'level': 2, 'name': 'Abaddon'},
'chess_abaddon11': {'cost': 2, 'level': 3, 'name': 'Abaddon'},
'chess_am': {'cost': 1, 'level': 1, 'name': 'Anti-mage'},
'chess_am1': {'cost': 1, 'level': 2, 'name': 'Anti-mage'},
'chess_am11': {'cost': 1, 'level': 3, 'name': 'Anti-mage'},
'chess_axe': {'cost': 1, 'level': 1, 'name': 'Axe'},
'chess_axe1': {'cost': 1, 'level': 2, 'name': 'Axe'},
'chess_axe11': {'cost': 1, 'level': 3, 'name': 'Axe'},
'chess_bat': {'cost': 2, 'level': 1, 'name': 'Batrider'},
'chess_bat1': {'cost': 2, 'level': 2, 'name': 'Batrider'},
'chess_bat11': {'cost': 2, 'level': 3, 'name': 'Batrider'},
'chess_bh': {'cost': 1, 'level': 1, 'name': 'Bounty Hunter'},
'chess_bh1': {'cost': 1, 'level': 2, 'name': 'Bounty Hunter'},
'chess_bh11': {'cost': 1, 'level': 3, 'name': 'Bounty Hunter'},
'chess_bm': {'cost': 2, 'level': 1, 'name': 'Beastmaster'},
'chess_bm1': {'cost': 2, 'level': 2, 'name': 'Beastmaster'},
'chess_bm11': {'cost': 2, 'level': 3, 'name': 'Beastmaster'},
'chess_ck': {'cost': 2, 'level': 1, 'name': 'Chaos Knight'},
'chess_ck1': {'cost': 2, 'level': 2, 'name': 'Chaos Knight'},
'chess_ck11': {'cost': 2, 'level': 3, 'name': 'Chaos Knight'},
'chess_clock': {'cost': 1, 'level': 1, 'name': 'Clockwerk'},
'chess_clock1': {'cost': 1, 'level': 2, 'name': 'Clockwerk'},
'chess_clock11': {'cost': 1, 'level': 3, 'name': 'Clockwerk'},
'chess_cm': {'cost': 1, 'level': 1, 'name': 'Crystal Maiden'},
'chess_cm1': {'cost': 1, 'level': 2, 'name': 'Crystal Maiden'},
'chess_cm11': {'cost': 1, 'level': 3, 'name': 'Crystal Maiden'},
'chess_dazzle': {'cost': 2, 'level': 1, 'name': 'Dazzle'},
'chess_dazzle1': {'cost': 2, 'level': 2, 'name': 'Dazzle'},
'chess_dazzle11': {'cost': 2, 'level': 3, 'name': 'Dazzle'},
'chess_disruptor': {'cost': 5, 'level': 1, 'name': 'Disruptor'},
'chess_disruptor1': {'cost': 5, 'level': 2, 'name': 'Disruptor'},
'chess_disruptor11': {'cost': 5, 'level': 3, 'name': 'Disruptor'},
'chess_dk': {'cost': 4, 'level': 1, 'name': 'Dragon Knight'},
'chess_dk1': {'cost': 4, 'level': 2, 'name': 'Dragon Knight'},
'chess_dk11': {'cost': 4, 'level': 3, 'name': 'Dragon Knight'},
'chess_doom': {'cost': 4, 'level': 1, 'name': 'Doom'},
'chess_doom1': {'cost': 4, 'level': 2, 'name': 'Doom'},
'chess_doom11': {'cost': 4, 'level': 3, 'name': 'Doom'},
'chess_dp': {'cost': 5, 'level': 1, 'name': 'Death Prophet'},
'chess_dp1': {'cost': 5, 'level': 2, 'name': 'Death Prophet'},
'chess_dp11': {'cost': 5, 'level': 3, 'name': 'Death Prophet'},
'chess_dr': {'cost': 1, 'level': 1, 'name': 'Drow Ranger'},
'chess_dr1': {'cost': 1, 'level': 2, 'name': 'Drow Ranger'},
'chess_dr11': {'cost': 1, 'level': 3, 'name': 'Drow Ranger'},
'chess_eh': {'cost': 1, 'level': 1, 'name': 'Enchantress'},
'chess_eh1': {'cost': 1, 'level': 2, 'name': 'Enchantress'},
'chess_eh11': {'cost': 1, 'level': 3, 'name': 'Enchantress'},
'chess_enigma': {'cost': 5, 'level': 1, 'name': 'Enigma'},
'chess_enigma1': {'cost': 5, 'level': 2, 'name': 'Enigma'},
'chess_enigma11': {'cost': 5, 'level': 3, 'name': 'Enigma'},
'chess_fur': {'cost': 2, 'level': 1, 'name': 'Furion'},
'chess_fur1': {'cost': 2, 'level': 2, 'name': 'Furion'},
'chess_fur11': {'cost': 2, 'level': 3, 'name': 'Furion'},
'chess_ga': {'cost': 4, 'level': 1, 'name': 'Alchemist'},
'chess_ga1': {'cost': 4, 'level': 2, 'name': 'Alchemist'},
'chess_ga11': {'cost': 4, 'level': 3, 'name': 'Alchemist'},
'chess_gyro': {'cost': 5, 'level': 1, 'name': 'Gyrocopter'},
'chess_gyro1': {'cost': 5, 'level': 2, 'name': 'Gyrocopter'},
'chess_gyro11': {'cost': 5, 'level': 3, 'name': 'Gyrocopter'},
'chess_io': {'cost': 5, 'level': 1, 'name': 'Io'},
'chess_io1': {'cost': 5, 'level': 2, 'name': 'Io'},
'chess_io11': {'cost': 5, 'level': 3, 'name': 'Io'},
'chess_jugg': {'cost': 2, 'level': 1, 'name': 'Juggernaut'},
'chess_jugg1': {'cost': 2, 'level': 2, 'name': 'Juggernaut'},
'chess_jugg11': {'cost': 2, 'level': 3, 'name': 'Juggernaut'},
'chess_kael': {'cost': 5, 'level': 1, 'name': 'Invoker'},
'chess_kael1': {'cost': 5, 'level': 2, 'name': 'Invoker'},
'chess_kael11': {'cost': 5, 'level': 3, 'name': 'Invoker'},
'chess_kunkka': {'cost': 5, 'level': 1, 'name': 'Kunkka'},
'chess_kunkka1': {'cost': 5, 'level': 2, 'name': 'Kunkka'},
'chess_kunkka11': {'cost': 5, 'level': 3, 'name': 'Kunkka'},
'chess_ld': {'cost': 4, 'level': 1, 'name': 'Lone Druid'},
'chess_ld1': {'cost': 4, 'level': 2, 'name': 'Lone Druid'},
'chess_ld11': {'cost': 4, 'level': 3, 'name': 'Lone Druid'},
// 'chess_lich': {'cost': 2, 'level': 1, 'name': 'Lich'},
// 'chess_lich1': {'cost': 2, 'level': 2, 'name': 'Lich'},
// 'chess_lich11': {'cost': 2, 'level': 3, 'name': 'Lich'},
'chess_light': {'cost': 4, 'level': 1, 'name': 'Keeper of the Light'},
'chess_light1': {'cost': 4, 'level': 2, 'name': 'Keeper of the Light'},
'chess_light11': {'cost': 4, 'level': 3, 'name': 'Keeper of the Light'},
'chess_lina': {'cost': 3, 'level': 1, 'name': 'Lina'},
'chess_lina1': {'cost': 3, 'level': 2, 'name': 'Lina'},
'chess_lina11': {'cost': 3, 'level': 3, 'name': 'Lina'},
// 'chess_luna': {'cost': 2, 'level': 1, 'name': 'Luna'},
// 'chess_luna1': {'cost': 2, 'level': 2, 'name': 'Luna'},
// 'chess_luna11': {'cost': 2, 'level': 3, 'name': 'Luna'},
'chess_lyc': {'cost': 3, 'level': 1, 'name': 'Lycan'},
'chess_lyc1': {'cost': 3, 'level': 2, 'name': 'Lycan'},
'chess_lyc11': {'cost': 3, 'level': 3, 'name': 'Lycan'},
'chess_mars': {'cost': 1, 'level': 1, 'name': 'Mars'},
'chess_mars1': {'cost': 1, 'level': 2, 'name': 'Mars'},
'chess_mars11': {'cost': 1, 'level': 3, 'name': 'Mars'},
'chess_medusa': {'cost': 4, 'level': 1, 'name': 'Medusa'},
'chess_medusa1': {'cost': 4, 'level': 2, 'name': 'Medusa'},
'chess_medusa11': {'cost': 4, 'level': 3, 'name': 'Medusa'},
'chess_morph': {'cost': 2, 'level': 1, 'name': 'Morphling'},
'chess_morph1': {'cost': 2, 'level': 2, 'name': 'Morphling'},
'chess_morph11': {'cost': 2, 'level': 3, 'name': 'Morphling'},
'chess_nec': {'cost': 4, 'level': 1, 'name': 'Necrophos'},
'chess_nec1': {'cost': 4, 'level': 2, 'name': 'Necrophos'},
'chess_nec11': {'cost': 4, 'level': 3, 'name': 'Necrophos'},
'chess_ok': {'cost': 3, 'level': 1, 'name': 'Omniknight'},
'chess_ok1': {'cost': 3, 'level': 2, 'name': 'Omniknight'},
'chess_ok11': {'cost': 3, 'level': 3, 'name': 'Omniknight'},
'chess_om': {'cost': 2, 'level': 1, 'name': 'Ogre Magi'},
'chess_om1': {'cost': 2, 'level': 2, 'name': 'Ogre Magi'},
'chess_om11': {'cost': 2, 'level': 3, 'name': 'Ogre Magi'},
'chess_pa': {'cost': 3, 'level': 1, 'name': 'Phantom Assassin'},
'chess_pa1': {'cost': 3, 'level': 2, 'name': 'Phantom Assassin'},
'chess_pa11': {'cost': 3, 'level': 3, 'name': 'Phantom Assassin'},
'chess_pom': {'cost': 2, 'level': 1, 'name': 'Mirana'},
'chess_pom1': {'cost': 2, 'level': 2, 'name': 'Mirana'},
'chess_pom11': {'cost': 2, 'level': 3, 'name': 'Mirana'},
// 'chess_puck': {'cost': 2, 'level': 1, 'name': 'Puck'},
// 'chess_puck1': {'cost': 2, 'level': 2, 'name': 'Puck'},
// 'chess_puck11': {'cost': 2, 'level': 3, 'name': 'Puck'},
'chess_qop': {'cost': 5, 'level': 1, 'name': 'Queen of Pain'},
'chess_qop1': {'cost': 5, 'level': 2, 'name': 'Queen of Pain'},
'chess_qop11': {'cost': 5, 'level': 3, 'name': 'Queen of Pain'},
'chess_razor': {'cost': 3, 'level': 1, 'name': 'Razor'},
'chess_razor1': {'cost': 3, 'level': 2, 'name': 'Razor'},
'chess_razor11': {'cost': 3, 'level': 3, 'name': 'Razor'},
// 'chess_riki': {'cost': 3, 'level': 1, 'name': 'Riki'},
// 'chess_riki1': {'cost': 3, 'level': 2, 'name': 'Riki'},
// 'chess_riki11': {'cost': 3, 'level': 3, 'name': 'Riki'},
'chess_sf': {'cost': 2, 'level': 1, 'name': 'Shadow Fiend'},
'chess_sf1': {'cost': 2, 'level': 2, 'name': 'Shadow Fiend'},
'chess_sf11': {'cost': 2, 'level': 3, 'name': 'Shadow Fiend'},
'chess_shredder': {'cost': 2, 'level': 1, 'name': 'Timbersaw'},
'chess_shredder1': {'cost': 2, 'level': 2, 'name': 'Timbersaw'},
'chess_shredder11': {'cost': 2, 'level': 3, 'name': 'Timbersaw'},
'chess_sk': {'cost': 3, 'level': 1, 'name': 'Sand King'},
'chess_sk1': {'cost': 3, 'level': 2, 'name': 'Sand King'},
'chess_sk11': {'cost': 3, 'level': 3, 'name': 'Sand King'},
'chess_slardar': {'cost': 2, 'level': 1, 'name': 'Slardar'},
'chess_slardar1': {'cost': 2, 'level': 2, 'name': 'Slardar'},
'chess_slardar11': {'cost': 2, 'level': 3, 'name': 'Slardar'},
'chess_slark': {'cost': 3, 'level': 1, 'name': 'Slark'},
'chess_slark1': {'cost': 3, 'level': 2, 'name': 'Slark'},
'chess_slark11': {'cost': 3, 'level': 3, 'name': 'Slark'},
'chess_sniper': {'cost': 2, 'level': 1, 'name': 'Sniper'},
'chess_sniper1': {'cost': 2, 'level': 2, 'name': 'Sniper'},
'chess_sniper11': {'cost': 2, 'level': 3, 'name': 'Sniper'},
'chess_ss': {'cost': 1, 'level': 1, 'name': 'Shadow Shaman'},
'chess_ss1': {'cost': 1, 'level': 2, 'name': 'Shadow Shaman'},
'chess_ss11': {'cost': 1, 'level': 3, 'name': 'Shadow Shaman'},
'chess_sven': {'cost': 5, 'level': 1, 'name': 'Sven'},
'chess_sven1': {'cost': 5, 'level': 2, 'name': 'Sven'},
'chess_sven11': {'cost': 5, 'level': 3, 'name': 'Sven'},
'chess_ta': {'cost': 4, 'level': 1, 'name': 'Templar Assassin'},
'chess_ta1': {'cost': 4, 'level': 2, 'name': 'Templar Assassin'},
'chess_ta11': {'cost': 4, 'level': 3, 'name': 'Templar Assassin'},
'chess_tb': {'cost': 3, 'level': 1, 'name': 'Terrorblade'},
'chess_tb1': {'cost': 3, 'level': 2, 'name': 'Terrorblade'},
'chess_tb11': {'cost': 3, 'level': 3, 'name': 'Terrorblade'},
'chess_tech': {'cost': 5, 'level': 1, 'name': 'Techies'},
'chess_tech1': {'cost': 5, 'level': 2, 'name': 'Techies'},
'chess_tech11': {'cost': 5, 'level': 3, 'name': 'Techies'},
'chess_th': {'cost': 5, 'level': 1, 'name': 'Tidehunter'},
'chess_th1': {'cost': 5, 'level': 2, 'name': 'Tidehunter'},
'chess_th11': {'cost': 5, 'level': 3, 'name': 'Tidehunter'},
'chess_tiny': {'cost': 1, 'level': 1, 'name': 'Tiny'},
'chess_tiny1': {'cost': 1, 'level': 2, 'name': 'Tiny'},
'chess_tiny11': {'cost': 1, 'level': 3, 'name': 'Tiny'},
'chess_tk': {'cost': 1, 'level': 1, 'name': 'Tinker'},
'chess_tk1': {'cost': 1, 'level': 2, 'name': 'Tinker'},
'chess_tk11': {'cost': 1, 'level': 3, 'name': 'Tinker'},
'chess_tp': {'cost': 3, 'level': 1, 'name': 'Treant Protector'},
'chess_tp1': {'cost': 3, 'level': 2, 'name': 'Treant Protector'},
'chess_tp11': {'cost': 3, 'level': 3, 'name': 'Treant Protector'},
'chess_troll': {'cost': 4, 'level': 1, 'name': 'Troll Warlord'},
'chess_troll1': {'cost': 4, 'level': 2, 'name': 'Troll Warlord'},
'chess_troll11': {'cost': 4, 'level': 3, 'name': 'Troll Warlord'},
'chess_tusk': {'cost': 1, 'level': 1, 'name': 'Tusk'},
'chess_tusk1': {'cost': 1, 'level': 2, 'name': 'Tusk'},
'chess_tusk11': {'cost': 1, 'level': 3, 'name': 'Tusk'},
'chess_veno': {'cost': 3, 'level': 1, 'name': 'Venomancer'},
'chess_veno1': {'cost': 3, 'level': 2, 'name': 'Venomancer'},
'chess_veno11': {'cost': 3, 'level': 3, 'name': 'Venomancer'},
'chess_viper': {'cost': 3, 'level': 1, 'name': 'Viper'},
'chess_viper1': {'cost': 3, 'level': 2, 'name': 'Viper'},
'chess_viper11': {'cost': 3, 'level': 3, 'name': 'Viper'},
'chess_wd': {'cost': 1, 'level': 1, 'name': 'Witch Doctor'},
'chess_wd1': {'cost': 1, 'level': 2, 'name': 'Witch Doctor'},
'chess_wd11': {'cost': 1, 'level': 3, 'name': 'Witch Doctor'},
'chess_wr': {'cost': 4, 'level': 1, 'name': 'Windranger'},
'chess_wr1': {'cost': 4, 'level': 2, 'name': 'Windranger'},
'chess_wr11': {'cost': 4, 'level': 3, 'name': 'Windranger'},
'chess_ww': {'cost': 1, 'level': 1, 'name': 'Winter Wyvern'},
'chess_ww1': {'cost': 1, 'level': 2, 'name': 'Winter Wyvern'},
'chess_ww11': {'cost': 1, 'level': 3, 'name': 'Winter Wyvern'},
'chess_zeus': {'cost': 5, 'level': 1, 'name': 'Zeus'},
'chess_zeus1': {'cost': 5, 'level': 2, 'name': 'Zeus'},
'chess_zeus11': {'cost': 5, 'level': 3, 'name': 'Zeus'},
'chess_snap': {'cost': 5, 'level': 1, 'name': 'Snapfire'},
'chess_snap1': {'cost': 5, 'level': 2, 'name': 'Snapfire'},
'chess_snap11': {'cost': 5, 'level': 3, 'name': 'Snapfire'},
'chess_huskar': {'cost': 5, 'level': 1, 'name': 'Huskar'},
'chess_huskar1': {'cost': 5, 'level': 2, 'name': 'Huskar'},
'chess_huskar11': {'cost': 5, 'level': 3, 'name': 'Huskar'},
'chess_bs': {'cost': 2, 'level': 1, 'name': 'Bloodseeker'},
'chess_bs1': {'cost': 2, 'level': 2, 'name': 'Bloodseeker'},
'chess_bs11': {'cost': 2, 'level': 3, 'name': 'Bloodseeker'},
'chess_visage': {'cost': 5, 'level': 1, 'name': 'Visage'},
'chess_visage1': {'cost': 5, 'level': 2, 'name': 'Visage'},
'chess_visage11': {'cost': 5, 'level': 3, 'name': 'Visage'},
'chess_rubick': {'cost': 3, 'level': 1, 'name': 'Rubick'},
'chess_rubick1': {'cost': 3, 'level': 2, 'name': 'Rubick'},
'chess_rubick11': {'cost': 3, 'level': 3, 'name': 'Rubick'},
'chess_pudge': {'cost': 3, 'level': 1, 'name': 'Pudge'},
'chess_pudge1': {'cost': 3, 'level': 2, 'name': 'Pudge'},
'chess_pudge11': {'cost': 3, 'level': 3, 'name': 'Pudge'},
// 'chess_lion': {'cost': 2, 'level': 1, 'name': 'Lion'},
// 'chess_lion1': {'cost': 2, 'level': 2, 'name': 'Lion'},
// 'chess_lion11': {'cost': 2, 'level': 3, 'name': 'Lion'},
'chess_gs': {'cost': 4, 'level': 1, 'name': 'Grimstroke'},
'chess_gs1': {'cost': 4, 'level': 2, 'name': 'Grimstroke'},
'chess_gs11': {'cost': 4, 'level': 3, 'name': 'Grimstroke'},
'chess_oracle': {'cost': 2, 'level': 1, 'name': 'Oracle'},
'chess_oracle1': {'cost': 2, 'level': 2, 'name': 'Oracle'},
'chess_oracle11': {'cost': 2, 'level': 3, 'name': 'Oracle'},
'chess_na': {'cost': 4, 'level': 1, 'name': 'Nyx Assassin'},
'chess_na1': {'cost': 4, 'level': 2, 'name': 'Nyx Assassin'},
'chess_na11': {'cost': 4, 'level': 3, 'name': 'Nyx Assassin'},
'chess_br': {'cost': 4, 'level': 1, 'name': 'Broodmother'},
'chess_br1': {'cost': 4, 'level': 2, 'name': 'Broodmother'},
'chess_br11': {'cost': 4, 'level': 3, 'name': 'Broodmother'},
'chess_lc': {'cost': 3, 'level': 1, 'name': 'Legion Commander'},
'chess_lc1': {'cost': 3, 'level': 2, 'name': 'Legion Commander'},
'chess_lc11': {'cost': 3, 'level': 3, 'name': 'Legion Commander'},
'chess_chen': {'cost': 4, 'level': 1, 'name': 'Chen'},
'chess_chen1': {'cost': 4, 'level': 2, 'name': 'Chen'},
'chess_chen11': {'cost': 4, 'level': 3, 'name': 'Chen'},
'chess_dw': {'cost': 1, 'level': 1, 'name': 'Dark Willow'},
'chess_dw1': {'cost': 1, 'level': 2, 'name': 'Dark Willow'},
'chess_dw11': {'cost': 1, 'level': 3, 'name': 'Dark Willow'},
'chess_thd': {'cost': 5, 'level': 1, 'name': 'Jakiro'},
'chess_thd1': {'cost': 5, 'level': 2, 'name': 'Jakiro'},
'chess_thd11': {'cost': 5, 'level': 3, 'name': 'Jakiro'},
'chess_brew': {'cost': 2, 'level': 1, 'name': 'Brewmaster'},
'chess_brew1': {'cost': 2, 'level': 2, 'name': 'Brewmaster'},
'chess_brew2': {'cost': 2, 'level': 3, 'name': 'Brewmaster'},
'chess_ember': {'cost': 2, 'level': 1, 'name': 'Storm Spirit'},
'chess_ember1': {'cost': 2, 'level': 2, 'name': 'Storm Spirit'},
'chess_ember2': {'cost': 2, 'level': 3, 'name': 'Storm Spirit'},
'chess_storm': {'cost': 2, 'level': 1, 'name': 'Ember Spirit'},
'chess_storm1': {'cost': 2, 'level': 2, 'name': 'Ember Spirit'},
'chess_storm2': {'cost': 2, 'level': 3, 'name': 'Ember Spirit'}
};



var round_descriptions = {
    1 : '2 Creeps',
    2 : '3 Creeps',
    3 : '5 Creeps',
    10 : 'Stone Golems', 
    15 : 'Jumping Wolfs',
    20 : 'Hellbears', 
    25 : 'Wildwings',
    30 : 'Big cows',
    35 : 'Black Dragon', 
    40 : 'Trolls',
    45 : 'Yearbeast',
    50 : 'Roshan'
};

var hero_id_list = [];
for (var key in hero_dict) {
    if (hero_dict.hasOwnProperty(key)) {
        var name_stripped = key.replace(/1/g, '');
        if (!isInArray(name_stripped, hero_id_list)) {
            hero_id_list.push(name_stripped);
        }    
    }
}

var hero_pool_counts = {1 : 45, 2 : 30, 3 : 25, 4 : 15, 5 : 10};

var level_thresholds = {1 : 1, 2 : 2, 3 : 3, 4 : 5, 5 : 8};

var cost_draw_probs_by_level = {
    1 : {1 : 1, 2 : 0, 3 : 0, 4 : 0, 5 : 0},
    2 : {1 : 0.70, 2 : 0.30, 3 : 0, 4 : 0, 5 : 0},
    3 : {1 : 0.60, 2 : 0.35, 3 : 0.05, 4 : 0, 5 : 0},
    4 : {1 : 0.50, 2 : 0.35, 3 : 0.15, 4 : 0, 5 : 0},
    5 : {1 : 0.40, 2 : 0.35, 3 : 0.23, 4 : 0.02, 5 : 0},
    6 : {1 : 0.33, 2 : 0.30, 3 : 0.30, 4 : 0.07, 5 : 0},
    7 : {1 : 0.30, 2 : 0.30, 3 : 0.30, 4 : 0.10, 5 : 0},
    8 : {1 : 0.24, 2 : 0.30, 3 : 0.30, 4 : 0.15, 5 : 0.01},
    9 : {1 : 0.22, 2 : 0.30, 3 : 0.25, 4 : 0.20, 5 : 0.03},
    10 : {1 : 0.19, 2 : 0.25, 3 : 0.25, 4 : 0.25, 5 : 0.06},
};

var local_player_team;
var user_steam_id;
var courier_id, courier_player_id, previous_courier_xp_to_level, previous_courier_level, previous_courier_gold;
var enemies_steam_ids = {};
var first_time = true;

/*START-DRAWSTAT*/  

var hero_counts = {};
var size_cost_pool = get_total_size_of_pool(hero_counts, 1);

/*END-DRAWSTAT*/  

function OnShowTime(keys) {
    if (first_time) {

        // Detect language

        // if (find_dota_hud_element('text_bullet_toggle').text== '显示聊天弹幕') {
          $.Msg('Chinese client detected')

          // Translate tier list
          var tier_dict_cn = {};
          Object.keys(tier_dict).forEach(function(key) {
              tier_dict_cn[eng_to_cn[key]] = tier_dict[key];
          });
          tier_dict = tier_dict_cn;

          // Translate hero details

          var hero_dict_cn = {}
          Object.keys(hero_dict).forEach(function(key) {
              hero_dict_cn[key] = hero_dict[key];
              hero_dict_cn[key]['name'] = eng_to_cn[hero_dict_cn[key]['name']]
          });
          hero_dict = hero_dict_cn;
          
          //$.Msg(hero_dict)

        // } else {
        //     $.Msg('English client detected')
        // }

        /*START-DRAWSTAT*/  

        size_cost_pool = get_total_size_of_pool(hero_counts, 1);

        // $.Each(hero_id_list, function(item) {
        //     var tmp_ele = find_dota_hud_element(item);
        //     if (tmp_ele) {
        //         var tmp_ret = calculate_draw_prop(item, hero_counts, 1, size_cost_pool);
        //         var hero_perc_avail = tmp_ret[0];
        //         tmp_ele.text = hero_perc_avail + '%';
        //         tmp_ele.style['color'] = tmp_ret[1];
        //     } 
        // });
        //Update display draw_prop method in Chess board.
        update_list_draw_prop(hero_counts, size_cost_pool);

        /*END-DRAWSTAT*/  

        // Get player info
        local_player_team = Players.GetTeam(Players.GetLocalPlayer());
        user_steam_id = Game.GetPlayerInfo(Players.GetLocalPlayer()).player_steamid;
        courier_player_id = Game.GetPlayerInfo(Players.GetLocalPlayer()).player_id;
        $.Msg('Steam ID:' + user_steam_id);
        $.Msg('Player Team:' + local_player_team);
        $.Msg('Player ID:' + courier_player_id);

        //get courier id and enemies steam_ids
        $.Each(Entities.GetAllHeroEntities(), function(entity) {
            var team = Entities.GetTeamNumber(entity);
            if ( local_player_team == team ) {
                courier_id = entity;
                return;
            }

            enemies_steam_ids[team] = {
                steam_id: Game.GetPlayerInfo(Entities.GetPlayerOwnerID(entity)).steam_id,
                entity: entity,
                is_dead: false,
            };
        });

        // Make space for Tier indicator

        find_dota_hud_element('panel_hero_draw_card_0').GetParent().style['height'] = '380px';

        var times = 5;
        for(var i=0; i < times; i++){
            find_dota_hud_element('panel_hero_draw_card_' + i).style['height'] = '380px';
        }

        //Add Probability Panel
        DrawChessProbabilites();
        $.Schedule(1, OnXPGained);
        // End

        first_time = false;

    }
}

function OnBattleInfo(data) {
    var cur_round = data.round;
    var courier_level_round = Entities.GetLevel(courier_id);

    /*START-DRAWSTAT*/  

    if (cur_round > 0 && data.type != 'prepare') {
        hero_counts = getCurrentChamps();
        size_cost_pool = get_total_size_of_pool(hero_counts, courier_level_round);

        // $.Each(hero_id_list, function(item) {
        //     var tmp_ele = find_dota_hud_element(item);
        //     if (tmp_ele) {
        //         var tmp_ret = calculate_draw_prop(item, hero_counts, courier_level_round, size_cost_pool);
        //         var hero_perc_avail = tmp_ret[0];
        //         tmp_ele.text = hero_perc_avail + '%';
        //         tmp_ele.style['color'] = tmp_ret[1];
        //     } 
        // });
        //Update display draw_prop method in Chess board.
        update_list_draw_prop(hero_counts, size_cost_pool);

    }

    /*END-DRAWSTAT*/ 

    if (!find_dota_hud_element('CustomUIContainer_Hud').FindChild('pve_warning')) {
        find_dota_hud_element('winstreak').style['width'] = '100%';
        var parentLabel = find_dota_hud_element('CustomUIContainer_Hud');
        var template_pve_warning = '<Label text=" " id="pve_warning" class="invisible" style="font-size: 35px; font-weight: bold; text-align: center; width: 100%; margin-top: 78%; color: #ff8888;"/>';
        parentLabel.BCreateChildren(template_pve_warning);
    }

    if (cur_round in round_descriptions) {

        if (cur_round > 3 && data.type == 'prepare') {
            var pve_warning_ele = find_dota_hud_element('pve_warning');

            pve_warning_ele.text = 'PVE ROUND: ' + round_descriptions[cur_round];
            pve_warning_ele.SetHasClass('invisible',false);
    
            pve_warning_ele.style['transform'] = 'scale3d( 1.5, 1.5, 1.5)';
            $.Schedule(0.3,function(){
                pve_warning_ele.style['transform'] = 'scale3d( 1,1,1)';
            });
    
            var effects;
    
            Game.EmitSound("announcer_announcer_mega_now_enm", 500, 100, 1);
            effects = Particles.CreateParticle("particles/econ/events/killbanners/screen_killbanner_compendium14_rampage.vpcf",6,0)
            $.Schedule(5,function(){
                Particles.DestroyParticleEffect(effects,true)
            })
        }

    } else {
        find_dota_hud_element('pve_warning').SetHasClass('invisible',true);
        find_dota_hud_element('pve_warning').text = '';
    }

    //at the start of a round the XP will have increased
    if (data.type == 'prepare' && !first_time) {
        //need a small delay because battle_info fires just before the XP is changed on the client
        $.Schedule(1, function() {
            OnXPGained();
        });
    }

};

function OnShowDrawCard(keys){
    
    var courier_level = Entities.GetLevel(courier_id);

    // Add Tier + Probability

    $.Schedule(0.75, function(){

        /*START-DRAWSTAT*/  

        // Update list

        // $.Each(hero_id_list, function(item) {
        //     var tmp_ele = find_dota_hud_element(item);
        //     if (tmp_ele) {
        //         var tmp_ret = calculate_draw_prop(item, hero_counts, courier_level, size_cost_pool);
        //         var hero_perc_avail = tmp_ret[0];
        //         tmp_ele.text = hero_perc_avail + '%';
        //         tmp_ele.style['color'] = tmp_ret[1];
        //     } 
        // });
        //Update display draw_prop method in Chess board.
        update_list_draw_prop(hero_counts, size_cost_pool);

        /*END-DRAWSTAT*/ 

        var times = 5;
        for(var i=0; i < times; i++){
            // var champ_name = find_dota_hud_element('panel_hero_draw_card_' + i).FindChild('text_draw_card_' + i).text.replace('★', '').trim();
            var champ_name = find_dota_hud_element('panel_draw_card_name_' + i).FindChild('text_draw_card_' + i).text.replace('★', '').trim();
            var champ_tier = tier_dict[champ_name];
            var parentPanel = find_dota_hud_element('panel_hero_draw_card_' + i);
            var costPanel = parentPanel.FindChild('text_draw_card_price_' + i);
            var hero_cost = parseInt(costPanel.text.replace('×', ''));
            var hero_pool = hero_pool_counts[hero_cost]; 

            if (!champ_tier) {
                champ_tier = '?';
            } 

            /*START-DRAWSTAT*/  

            if (champ_name in hero_counts) {
                var hero_in_play = hero_counts[champ_name];
            } else {
                var hero_in_play = 0
            }

            var size_hero_cost_pool = size_cost_pool[hero_cost];
        
            var num_hero_avail = hero_pool - hero_in_play; // 可用的该牌数量 = 该牌可能的最大数量 - 该牌已被抽取的数量
            var num_bad_draws = size_hero_cost_pool - num_hero_avail; 
        
            var good_cost_prob = cost_draw_probs_by_level[courier_level][hero_cost];
            var bad_cost_prob = 1 - good_cost_prob;
            
            $.Msg(i+" card:");
            $.Msg(hero_pool + " , " + hero_in_play + " , " + num_hero_avail + " , " + size_hero_cost_pool + " , " + num_bad_draws + " , " + good_cost_prob + " , " + bad_cost_prob)
        
            var prop_at_least_one = 1 - ((bad_cost_prob + (good_cost_prob * (num_bad_draws / size_hero_cost_pool))) * 
                                        (bad_cost_prob + (good_cost_prob * ((num_bad_draws - 1) / (size_hero_cost_pool - 1)))) * 
                                        (bad_cost_prob + (good_cost_prob * ((num_bad_draws - 2) / (size_hero_cost_pool - 2)))) * 
                                        (bad_cost_prob + (good_cost_prob * ((num_bad_draws - 3) / (size_hero_cost_pool - 3)))) * 
                                        (bad_cost_prob + (good_cost_prob * ((num_bad_draws - 4) / (size_hero_cost_pool - 4)))));

            var hero_perc_avail = Math.round(prop_at_least_one * 100);

            if (champ_name == 'Io' || champ_name == '精灵守卫') {
                hero_perc_avail = 1.5;
            }

            /*END-DRAWSTAT*/ 
            
            if (DISPLAY_DRAW_PROB && DISPLAY_TIER) {
                var template = '<Label text="' + champ_tier + ' (' + hero_in_play + ' / ' + hero_perc_avail + '%)" id="rank_draw_card_' + i + '" style = "font-size: 26px; font-weight: bold; width: 250px; text-align: center; margin-top: 333px; margin-left: 15px; z-index: 600;"/> ';
            } else if (DISPLAY_DRAW_PROB) {
                var template = '<Label text="(' + hero_in_play + ' / ' + hero_perc_avail + '%)" id="rank_draw_card_' + i + '" style = "font-size: 26px; font-weight: bold; width: 250px; text-align: center; margin-top: 333px; margin-left: 15px; z-index: 600;"/> ';
            } else {
                var template = '<Label text=" " id="rank_draw_card_' + i + '" style = "font-size: 26px; font-weight: bold; width: 250px; text-align: center; margin-top: 333px; margin-left: 15px; z-index: 600;"/> ';
            }

            if (!find_dota_hud_element('panel_hero_draw_card_' + i).FindChild('rank_draw_card_' + i)) {
                parentPanel.BCreateChildren(template);
            } else {
                if (DISPLAY_DRAW_PROB && DISPLAY_TIER) {
                    find_dota_hud_element('rank_draw_card_' + i).text = champ_tier + ' (' + hero_in_play + ' / ' + hero_perc_avail + '%)';
                } else if (DISPLAY_DRAW_PROB) {
                    find_dota_hud_element('rank_draw_card_' + i).text = '(' + hero_in_play + ' / ' + hero_perc_avail + '%)';
                } else {
                    find_dota_hud_element('rank_draw_card_' + i).text = " ";
                }
            }
        }
    })
}

//In reality this method is called every time a player's HP or Gold changes (mp for gold)
function OnSyncHp(data) {
    var current_gold = Math.round(data.mp);

    if (data.player_id == courier_player_id && current_gold != previous_courier_gold) {
        //if someone has spent 5 gold they have either leveled or bought a 5 cost unit
        if (current_gold == previous_courier_gold - 5) {
            OnXPGained();
        }

        previous_courier_gold = current_gold;
    }
}

/*
    Creates a bunch of labels for the chess probabilities in the form:
    100% / 0% / 0% / 0% / 0% (for example if level 1).
    There are 5 labels for each chess piece rarity (1-cost, 2-cost etc.) 
    and 4 labels for each / in between them.
    I position them using the position style with their x position corresponding
    to what percantage along the panel they should be placed.
    I worked out that the 5 probablities should take up 18% of the space each and
    the slashes should take up 2.5% (5 * 18 + 4 * 2.5 = 100).
    i.e. the first percentage has a x position of 0%, the 2nd one has a x position of 20.5% (18 + 2.5)
    I went through all this hassle so that the positioning will be consistent regardless
    of how much space each of the percentage strings take up so:
    100% / 0% / 0% / 0% / 0% will be similar to 20% / 25% / 30% / 15% / 10%.
    There was probably a better way to do this but I found working with the panorama css styles
    frustrating and inconsistent with normal css and doesn't have stuff like flexbox so *shrug*
*/
function DrawChessProbabilites() {
    var hudRoot;

	for(panel=$.GetContextPanel();panel!=null;panel=panel.GetParent()){
        hudRoot = panel;
    }
    
	
    var probability_panel = '<Panel id="level_stats_panel" style="width: 260px; height: 149px; position:248px 934px 0px; background-color: gradient( linear, 0% 0%, 0% 100%, from( rgba(68, 68, 68, 0.95) ), to( rgba(22, 22, 22, 0.95) ) ); border-radius: 4px 4px 0px 0px; z-index: -200;" />';
    hudRoot.BCreateChildren(probability_panel);

    var level_probability_panel = '<Panel id ="chess_probability" style="width: 100%; flow-children: down; vertical-align: top; margin-top: 6px;"/>';
    find_dota_hud_element('level_stats_panel').BCreateChildren(level_probability_panel);

    var current_level_probability_panel = '<Panel id="current_level_probability" style="width: 100%; flow-children: none;" />';
    find_dota_hud_element('chess_probability').BCreateChildren(current_level_probability_panel);

    //Draw slashes
    for (var i = 1; i <= 4; i++) {
        var x_position = i * 18 + ((i-1) * 2.5);
        var slash = '<Label text="/" style="font-size: 20px; width: 2.5%; position: ' + x_position + '% 0% 0%; text-align: center; font-family: Radiance,FZLanTingHei-R-GBK,TH Sarabun New,YDYGO 540,Gulim,MingLiU; text-shadow: 1px 1px 1px 1.0 #000000ff; color: #bbb;"/>';
        find_dota_hud_element('current_level_probability').BCreateChildren(slash);
    }
    
    //Colours for the text for 1-cost, 2-cost etc.
    var colours = ['#bbb', '#bbbbff', '#5194f7', '#ff00ff', '#ff8800'];

    //Draw current level probabilities
    for (var i = 0; i <= 4; i++) {
        var x_position = i * 20.5;

        var probability_label = '<Label text="" id="current_chess_probabilities' + i + '" style="font-size: 20px; width: 18%; position: ' + x_position + '% 0% 0%; text-align: center; color: ' + colours[i] + '; font-family: Radiance,FZLanTingHei-R-GBK,TH Sarabun New,YDYGO 540,Gulim,MingLiU; text-shadow: 1px 1px 1px 1.0 #000000ff;"/>';
        find_dota_hud_element('current_level_probability').BCreateChildren(probability_label);
    }

    var next_level_panel = '<Panel id="next_panel" style="width: 100%; flow-children: down; margin-top: 5px;" />';
    var next_level_text_panel = '<Panel id="next_level_text" style="width: 100%;" />';
    var next_level_probability_holder = '<Panel id="next_level_probability_holder" style="width: 100%; flow-children: none; opacity: 0.7;" />';
    var next_level_probability_panel = '<Panel id="next_level_probability" style="flow-children: none; width: 80%; position: 10% 0% 0%;"/>';
    find_dota_hud_element('chess_probability').BCreateChildren(next_level_panel);
    find_dota_hud_element('next_panel').BCreateChildren(next_level_text_panel);
    find_dota_hud_element('next_panel').BCreateChildren(next_level_probability_holder);
    find_dota_hud_element('next_level_probability_holder').BCreateChildren(next_level_probability_panel);
    
    var next_level_text_label = '<Label text="NEXT LEVEL:" style="font-size: 14px; width: 100%; text-align: center; font-family: Radiance,FZLanTingHei-R-GBK,TH Sarabun New,YDYGO 540,Gulim,MingLiU; text-shadow: 1px 1px 1px 1.0 #000000ff; color: #ffffff; font-weight: bold; letter-spacing: 2px;"/>'
    find_dota_hud_element('next_level_text').BCreateChildren(next_level_text_label);

    //Draw slashes
    for (var i = 1; i <= 4; i++) {
        var x_position = i * 18 + ((i-1) * 2.5);
        var slash = '<Label text="/" style="font-size: 18px; width: 2.5%; position: ' + x_position + '% 0% 0%; text-align: center; font-family: Radiance,FZLanTingHei-R-GBK,TH Sarabun New,YDYGO 540,Gulim,MingLiU; text-shadow: 1px 1px 1px 1.0 #000000ff; color: #bbb;"/>';
        find_dota_hud_element('next_level_probability').BCreateChildren(slash);
    }

    for (var i = 0; i <= 4; i++) {
        var x_position = i * 20.5;

        var probability_label = '<Label text="" id="next_chess_probabilities' + i + '" style="font-size: 18px; width: 18%; position: ' + x_position + '% 0% 0%; text-align: center; color: ' + colours[i] + '; font-family: Radiance,FZLanTingHei-R-GBK,TH Sarabun New,YDYGO 540,Gulim,MingLiU; text-shadow: 1px 1px 1px 1.0 #000000ff;"/>';
        find_dota_hud_element('next_level_probability').BCreateChildren(probability_label);
    }

    var xp_required_to_level_panel = '<Panel id="xp-required-to-level" style="width: 100%; vertical-align: bottom; margin-bottom: 6px;" />';
    find_dota_hud_element('level_stats_panel').BCreateChildren(xp_required_to_level_panel);

    var xp_required_to_level_label = '<Label text="" id="xp-required-text" style="font-size: 14px; width: 100%; text-align: center; font-family: Radiance,FZLanTingHei-R-GBK,TH Sarabun New,YDYGO 540,Gulim,MingLiU; text-shadow: 1px 1px 1px 1.0 #000000ff; color: #ffffff; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;" />'
    find_dota_hud_element('xp-required-to-level').BCreateChildren(xp_required_to_level_label);
}

function OnXPGained() {
    if (previous_courier_level == 10) {
        return;
    }

    var courier_xp_to_level = Entities.GetNeededXPToLevel(courier_id) - Entities.GetCurrentXP(courier_id);
    var courier_level = Entities.GetLevel(courier_id);

    if (previous_courier_xp_to_level != courier_xp_to_level) {
        previous_courier_xp_to_level = courier_xp_to_level;
        UpdateXPGoldText(courier_xp_to_level);
    }

    if (previous_courier_level != courier_level) {
        previous_courier_level = courier_level;
        UpdateProbabilityTextForLevel(courier_level);
    }
}

function UpdateXPGoldText(xp_required) {
    find_dota_hud_element('xp-required-text').text = 
        xp_required + 'XP (' + Math.ceil(xp_required/4)*4 + ' GOLD) TO LEVEL UP !';
}

function UpdateProbabilityTextForLevel(level) {
    UpdateProbabilityText(level, true);
    if (level < 10) {
        UpdateProbabilityText(level + 1, false);
    } else {
        find_dota_hud_element('next_panel').RemoveAndDeleteChildren();
        find_dota_hud_element('xp-required-to-level').RemoveAndDeleteChildren();
    }
}

function UpdateProbabilityText(level, isCurrentLevel) {
    Object.keys(cost_draw_probs_by_level[level])
        .map(function(chess_cost) { return cost_draw_probs_by_level[level][chess_cost] })
        .map(function(probability) { return parseInt(probability * 100) + '%' })
        .forEach(function(probabilityStr, idx) {
            var idPrefix = isCurrentLevel ? 'current' : 'next';
            find_dota_hud_element(idPrefix + '_chess_probabilities'+ idx)
                .text = probabilityStr;
        });
}

(function()
{  
    GameEvents.Subscribe("show_time", OnShowTime);
    GameEvents.Subscribe("battle_info", OnBattleInfo);
    GameEvents.Subscribe("show_draw_card", OnShowDrawCard);
    GameEvents.Subscribe("sync_hp", OnSyncHp);
})();
