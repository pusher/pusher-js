
def run_commands(cmds)
  pids = cmds.map { |cmd|
    spawn(cmd)
  }

  begin
    Process.waitall
  rescue Interrupt
    pids.each { |pid| Process.kill("INT", pid) }
    Process.waitall
  end
end
