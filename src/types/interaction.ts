export interface BlockActionPayload {
  type: "block_actions";
  user: User;
  api_app_id: string;
  token: string;
  container: Container;
  trigger_id: string;
  team: Team;
  enterprise: null;
  is_enterprise_install: boolean;
  response_url: string;
  actions: Action[];
}

export type Action = StaticSelectAction | ButtonAction;

export interface StaticSelectAction {
  type: "static_select";
  block_id: string;
  action_id: string;
  selected_option: SelectedOption;
  placeholder: Placeholder;
  action_ts: string;
}

export interface ButtonAction {
  type: "button";
  block_id: string;
  action_id: string;
  text: Text;
  value: string;
  action_ts: string;
}

export interface Placeholder {
  type: string;
  text: string;
  emoji: boolean;
}

export interface SelectedOption {
  text: Placeholder;
  value: string;
}

export interface Container {
  type: string;
  text: string;
}

export interface Team {
  id: string;
  domain: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  team_id: string;
}
