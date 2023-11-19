import { _decorator, Component, Node, NodeEventType,EventMouse, Event,instantiate, Vec3, Vec2, EventTouch, Input, input, EventKeyboard } from 'cc';
import { GameController } from '../game_logic/GameController';

const { ccclass, property } = _decorator;

@ccclass('ManageController')
export class ManageController extends Component {
    private max_obj = 8;
    private curr_obj_idx = 0;
    private prev_obj_idx = -1;
    private player_idx = -1;
    private normal_size = new Vec3(3, 3, 3);
    private big_size = new Vec3(5, 5, 5);
    private row_max = 5;
    private col_max = 5;
    //2-dimensional array with elements type is Vec3
    private UI_board: Vec3[][] = [];
    //2-dimensional array with: -1, 0, 1
    private current_board: number[][] = [];
    private blue_player_node = new Node();
    private red_player_node = new Node();
    private step_node = new Node()
    private red_flag = 0;
    private blue_flag = 0;
    private game_controller = new GameController();

    start() {
        input.on(Input.EventType.KEY_DOWN, this.pickup, this);
        this.set_up_before_running();
        // temp = this.get_another_board();
        // console.log("another board: ", temp);
        // this.render_all(temp);
        // input.on(Input.EventType.KEY_PRESSING, this.rotate, this);

       // let enemy_node = this.getEnemyNode(2, player_index);
        // let my_node = this.getNode(0, player_index);
        // let parent = this.getParentNode(player_index);
        // this.changeState(enemy_node, my_node, parent);
    }


    move_to(r_idx:number, c_idx:number, curr_node: Node) {
        let [old_r_idx, old_c_idx] = this.get_mapped_vec3_to_idx(curr_node.getPosition());
        let result = this.game_controller.make_move([[old_r_idx, old_c_idx], [r_idx, c_idx]]);

        console.log("Next board: ", result.cur_board);
            this.render_board_after_moving(result.cur_board);
    }

    set_up_before_running() {
        // 0: red
        // 1: blue
        //Get player flag input from menu interface here
        this.game_controller = new GameController();
        let player_flag = "blue";
        this.set_player_flag(player_flag);
        this.blue_player_node = instantiate(this.getNode(0, 1));
        this.red_player_node = instantiate(this.getNode(0, 0));
        let step_node = this.get_step_node();
        if (step_node != null) {
            // step_node["_lpos"] = new Vec3(-6, 0, 0);
            this.step_node = instantiate(step_node)
            // this.step_node["_lpos"] = new Vec3(-6, 0, 0);
            // this.step_node.setPosition(new Vec3(-6, 0, 0));
            // this.node.getChildByName("step_obj")?.addChild(this.step_node);
            // console.log("Original step node in setup before running: ", step_node);
            // console.log("Step node in setup before running: ", this.step_node);
        }
        else {
            console.log("Step not is null#############");
            this.step_node = new Node();
        }
        this.set_UI_board();
        this.setup_current_board();
        // console.log("Computed board: ", this.current_board)
        // console.log("UI board: ", this.UI_board)
    }

    update(deltaTime: number) {

    }

    get_step_node() {
        let step_obj =  this.node.getChildByName("step_obj");
        return step_obj?.getChildByName("sample_step");
    }

    pickup(event: EventKeyboard){
            // this.step_node.setPosition(new Vec3(-6, 0, 0));
            // this.node.getChildByName("step_obj")?.addChild(this.step_node);
        let keycode = event.keyCode;
        if (keycode == 32) {
            this.prev_obj_idx = this.curr_obj_idx;
            this.curr_obj_idx = (this.curr_obj_idx + 1) % this.max_obj;
            let curr_node = this.getNode(this.curr_obj_idx, this.player_idx)
            let prev_node = this.getNode(this.prev_obj_idx, this.player_idx);
            this.change_object_size(prev_node, curr_node);
            let legal_moves = this.get_legal_moves(curr_node);
            // console.log("Legal moves in pickup: ", legal_moves);
            this.render_legal_moves(legal_moves);

        }
        // this.get_impossible_steps()
    }

    get_mapped_step_idx_to_vec3(r_idx: number, c_idx: number) {
        let initial_x = -10;
        let factor_x = 4;
        let y = 0;
        let initial_z = -6;
        let factor_z = 3;
        let x = initial_x + c_idx * factor_x;
        let z = initial_z + r_idx * factor_z;
        return new Vec3(x,y,z);

    }

    render_legal_moves(legal_moves: [number, number][]) {
        console.log("In render_legal_moves()");
        console.log("Legal moves: ", legal_moves);
        for (let i = 0; i < legal_moves.length; i++) {
            let mapped_pos_vec3 = this.get_mapped_step_idx_to_vec3(legal_moves[i][0], legal_moves[i][1]);
            this.render_step_possible(mapped_pos_vec3);
        }
    }

    render_step_possible(vec_pos: Vec3) {
        console.log("vec in render step: ", vec_pos);
        let new_step = instantiate(this.step_node);
        new_step.setPosition(vec_pos);
        new_step["_active"] = true;
        // this.step_node.setPosition(new Vec3(1,0,1));
        // console.log("Blue player node: ", this.blue_player_node);
        // console.log("step_node: ", this.step_node);
        // console.log("new_step_node: ", new_step);

        // new_step.active = true;
        // this.step_node.getParent()?.addChild(new_step);
        this.node.getChildByName("step_obj")?.addChild(new_step);
    }

    change_object_size(prev_node: Node, curr_node: Node) {
            this.set_size(this.big_size, curr_node);
            this.set_size(this.normal_size, prev_node);
    }

    get_legal_moves(curr_node: Node) {
        let [r_node_idx, c_node_idx] = this.get_mapped_vec3_to_idx(curr_node.getPosition());
        let all_legal_moves = this.game_controller.get_legal_moves();
        let legal_moves = [];
        // console.log("All legal moves: ", all_legal_moves);
        for (let i = 0; i < all_legal_moves.length; i++) {
            // console.log("all_legal_moves[i][0][0]: ", all_legal_moves[i][0][0], "r_node_idx: ", r_node_idx, "all_legal_moves[i][0][1]: ", all_legal_moves[i][0][1], "c_node_idx: ", c_node_idx);
            if (all_legal_moves[i][0][0] == r_node_idx && all_legal_moves[i][0][1] == c_node_idx)
                legal_moves.push(all_legal_moves[i][1]);
        }
        return legal_moves;
    }

    render_board_after_moving(next_board: number[][]) {
        for (let r_idx = 0; r_idx < this.row_max; r_idx++) {
            for (let c_idx = 0; c_idx < this.col_max; c_idx++) {
                if (this.current_board[r_idx][c_idx] != next_board[r_idx][c_idx]) {
                    this.render_object(r_idx, c_idx, next_board[r_idx][c_idx]);
                }
            }
        }
        this.current_board = next_board;

    }

    update_new_node_to_parent(value: number, new_node: Node) {
        let flag_color = "blue_player";
        if (this.red_flag == value)
            flag_color = "red_player";
        let parent_node = this.node.getChildByName(flag_color);
        if (parent_node != null) {
            parent_node.addChild(new_node);
            return true;
        }
        return false;
    }

    clear_old_node(r_idx: number, c_idx: number, value: number) {
        let flag_color = "blue_player";
        if (this.red_flag == value)
            flag_color = "red_player";
        let player_nodes = this.node.getChildByName(flag_color)?.children;
        if (player_nodes != null) {
            let mapped_pos = this.get_mapped_idx_to_vec3(r_idx, c_idx);
            for (let i = 0; i < player_nodes.length; i++) {
                if (player_nodes[i].getPosition() == mapped_pos) {
                    player_nodes[i].destroy();
                    return true;
                }
            }
        }
        return false;
    }

    // clear_all() {
    //     let red_parent = this.node.getChildByName("red_player");
    //     let blue_parent = this.node.getChildByName("blue_player");
    //     for (let i = 0; i < 9; i++){
    //         if (red_parent?.children[i])
    //             red_parent?.children[i].destroy();
    //         if (blue_parent?.children[i])
    //             blue_parent?.children[i].destroy();
    //     }
    // }

    // render_all(next_board: number[][]) {
    //     for (let r_idx = 0; r_idx < 5; r_idx++) {
    //         for (let c_idx = 0; c_idx < 5; c_idx++) {
    //             if (next_board[r_idx][c_idx] != 0)
    //                 this.render_object_all(r_idx, c_idx, next_board[r_idx][c_idx]);
    //         }
    //     }
    // }

    // render_object_all(r_idx: number, c_idx: number, value: number) {
    //     let mapped_pos = this.get_mapped_idx_to_vec3(r_idx, c_idx);
    //     let node = instantiate(this.blue_player_node);
    //     if (value == this.red_flag)
    //         node = instantiate(this.red_player_node);
    //     node.setPosition(mapped_pos);
    //     if (value == this.red_flag)
    //         this.node.getChildByName("red_player")?.addChild(node);
    //     else
    //         this.node.getChildByName("blue_player")?.addChild(node);

    // }

    render_object(r_idx: number, c_idx: number, value: number) {
        this.clear_old_node(r_idx, c_idx, value);
        if (value != 0) {
            let UI_pos = this.get_pos_in_UI(r_idx, c_idx);
            let new_node = instantiate(this.blue_player_node);
            if (value == this.red_flag)
                new_node = instantiate(this.red_player_node);
            new_node.setPosition(UI_pos);
            this.update_new_node_to_parent(value, new_node);
        }
    }


    get_obj_at_idx(r_idx: number, c_idx: number) {
   }

    get_another_board() {
      return [
            [-1, -1, -1, 1, 1],
            [-1, 0, 0, 0, 1],
            [1, 1, 1, -1, 1],
            [-1, 1, 1, 1, 1],
            [1, 1, -1, 1, -1],
        ];

    }

    get_next_board() {
        return [
            [1, 1, 1, 1, 1],
            [-1, 0, 0, 0, 1],
            [1, -1, -1, -1, 1],
            [1, -1, 1, 1, 1],
            [1, 1, -1, 1, -1],
        ];
    }

    get_impossible_steps() {
        // let curr_node = this.get_curr_obj();
        // console.log("Current object location: ", curr_node.getPosition());
    }

    get_curr_obj() {

    }

    rotate() {
        let curr_obj = this.getNode(this.curr_obj_idx, this.player_idx);
        let prev_rotate_degr = curr_obj.getRotation()
        console.log("Rotation: ", prev_rotate_degr);
        // curr_obj.setRotation
    }

    changeState(enemy_node: any, my_node: any, parent: any) {
        let new_node = instantiate(my_node);
        let enemy_pos = enemy_node.getPosition();
        enemy_node.destroy();
        new_node.setPosition(enemy_pos);
        parent.addChild(new_node)
    }

    getParentNode(parent_index: number) {
        let parent = this.node.children[parent_index];
        return parent;
    }

    getNode(child_index: number, parent_index: number) {
        let parent_node = this.node.getChildByName("blue_player");
        if (this.red_flag == 1)
            parent_node = this.node.getChildByName("red_player");
        if (parent_node == null) {
            console.log("Error here: parent of player node doesn't exist");
            parent_node = new Node();
        }
        return parent_node.children[child_index];
    }

    getEnemyNode(child_index: number, parent_index: number) {
        let par_index = (parent_index + 1) % 2
        let node = this.node.children[par_index]["_children"][child_index];
        return node
    }

    jumpTo(new_pos: Vec3, node: any) {
        node.setPosition(new_pos);
    }


    set_UI_board() {
        this.UI_board = [];
        let initial_x = -50;
        let y = 0;
        let initial_z = -30;
        let initial_z_temp = initial_z;
        for (let r_idx = 0; r_idx < this.row_max; r_idx++) {
            this.UI_board[r_idx] = [];
            let initial_x_temp = initial_x;
            for (let c_idx = 0; c_idx < this.col_max; c_idx++) {
                this.UI_board[r_idx][c_idx] = new Vec3(initial_x_temp, y, initial_z_temp);
                initial_x_temp += 20;
            }
            initial_z_temp += 15;
        }
    }

    set_player_flag(player_color_input: string) {
        if (player_color_input == "red") {
            this.red_flag = 1;
            this.blue_flag = -1;
        } else {
            this.blue_flag = 1;
            this.red_flag = -1;
        }

    }

    setup_current_board() {
        if (this.blue_flag == 1) {
            this.current_board = [
                [-1, -1, -1, -1, -1],
                [-1, 0, 0, 0, -1],
                [1, 0, 0, 0, -1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
                ];
        } else {
            this.current_board = [
                [1, 1, 1, 1,1],
                [1, 0, 0, 0, 1],
                [-1, 0, 0, 0, 1],
                [-1, 0, 0, 0, -1],
                [-1, -1, -1, -1, -1]
                ];

        }

    }

    set_size(size: Vec3, node: Node) {
        node.setScale(size)
    }

    get_pos_in_UI(r_idx: number, c_idx: number) {
        return this.UI_board[r_idx][c_idx];
    }

    get_mapped_idx_to_vec3(r_idx: number, c_idx: number) {
        return this.UI_board[r_idx][c_idx];
    }

    get_mapped_vec3_to_idx(vec: Vec3) {
        // console.log("UI board: ", this.UI_board);
        // let ui_3_0 = this.UI_board[3][0];
        // console.log("Mapped vec3: ", vec);
        // console.log("UI [3][0]: ", ui_3_0);
        // if (vec.equals( ui_3_0))
        //     console.log("vec = ui_3_0");
        // else
        //     console.log(" Not Equal");
        for (let r_idx = 0; r_idx < this.row_max; r_idx++) {
            for (let c_idx = 0; c_idx < this.col_max; c_idx++) {
                if (this.UI_board[r_idx][c_idx].equals(vec))
                    return [r_idx, c_idx];
            }
        }
        return [-1, -1];
    }
}

