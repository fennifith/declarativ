workflow "publish on release" {
  on = "push"
  resolves = ["publish"]
}

action "publish" {
  uses = "actions/npm@master"
  args = "publish"
  secrets = ["npm_token"]
}
