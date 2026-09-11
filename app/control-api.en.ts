type EnglishControlCopy = {
  title: string;
  summary: string;
  parameters: string[];
  notes: string[];
};

export const englishControlCopy: Record<string, EnglishControlCopy> = {
  drive: {
    title: 'Continuous leg or wheel motion',
    summary: 'Sends forward speed and yaw rate to the active locomotion policy for a fixed duration. Lateral speed is currently zero.',
    parameters: ['vx: forward speed; legs -0.20 to 0.25 m/s, wheels -0.50 to 0.60 m/s', 'yaw: yaw rate; legs -1.00 to 1.00 rad/s, wheels -0.30 to 0.30 rad/s', 'ms: duration from 0 to 10,000 ms; motion values are clamped'],
    notes: ['Stop clears the command immediately.', 'Active keyboard, gamepad, or touch input takes priority in the official controller.'],
  },
  turn: {
    title: 'Turn in place', summary: 'Sends a yaw command with zero forward speed. Equivalent to drive(0, yaw, ms).',
    parameters: ['yaw: legs -1.00 to 1.00 rad/s, wheels -0.30 to 0.30 rad/s', 'ms: duration from 0 to 10,000 ms'],
    notes: ['Direction follows the simulator coordinate convention. Start with a small value.'],
  },
  look: {
    title: 'Control neck and head', summary: 'Temporarily enables head mode and writes four targets to command[3..6]. Head mode ends after the duration.',
    parameters: ['neck / pitch / yaw / roll: target radians, each clamped to -2.50 to 2.50', 'ms: hold duration from 0 to 10,000 ms'],
    notes: ['The deployment target must support the same head-command interface.', 'This is command-conditioned control, not a direct motor-angle command.'],
  },
  wait: {
    title: 'Wait', summary: 'Pauses script execution while the current policy or previously triggered skill continues to run.',
    parameters: ['ms: delay from 0 to 10,000 ms'], notes: ['Stop can interrupt the whole program during a wait.'],
  },
  reset: {
    title: 'Reset the physics world', summary: 'Calls resetSim() in the official simulator and waits for the reset animation to release its input lock.',
    parameters: ['No parameters'], notes: ['Physical hardware has no equivalent instant world reset.', 'The next command runs after the simulator accepts input again.'],
  },
  print: {
    title: 'Read and print an observation', summary: 'Reads the current 61D observation and writes one indexed value to the execution trace.',
    parameters: ['i: integer observation index from 0 to 60'], notes: ['The observation layout appears below.'],
  },
  repeat: {
    title: 'Repeat a block', summary: 'Runs the statements inside braces in order. repeat and if blocks may be nested.',
    parameters: ['n: integer repeat count from 1 to 20'], notes: ['The opening brace must be on the repeat line. Put the closing brace on its own line.'],
  },
  if: {
    title: 'Branch on an observation', summary: 'Samples the observation at this line and executes the block only when the condition is true.',
    parameters: ['i: observation index from 0 to 60', 'operator: <, <=, >, or >=', 'value: any finite number'], notes: ['The current language supports one numeric condition per block. Blocks may be nested.'],
  },
  'skill-roll': {
    title: 'Roll policy', summary: 'Switches to the official trained roll ONNX policy.', parameters: ['Fixed skill name: "roll"'],
    notes: ['The trigger is non-blocking; add wait(3200) to allow the official motion and recovery to finish.', 'This calls an existing policy and does not train a new motion.'],
  },
  'skill-kick': {
    title: 'Kick policy', summary: 'Switches to the official left-foot or right-foot kick ONNX policy.', parameters: ['Skill name: "kick_left" or "kick_right"'],
    notes: ['Call ball() first to spawn a football in the simulator.', 'The trigger is non-blocking.'],
  },
  'skill-ground-pick': {
    title: 'Ground-pick policy', summary: 'Switches to the official ground-pick ONNX policy.', parameters: ['Fixed skill name: "ground_pick"'],
    notes: ['The trigger is non-blocking; use wait() to allow execution time.'],
  },
  'skill-crouch': {
    title: 'Wheel-base crouch policy', summary: 'Triggers the official crouch policy while the wheel base is active.', parameters: ['Fixed skill name: "crouch"'],
    notes: ['Call rollers() first. The command fails when the leg base is active.'],
  },
  ball: {
    title: 'Spawn a football', summary: 'Spawns a football in the official MuJoCo scene for kick-policy tests.', parameters: ['No parameters'],
    notes: ['The legacy alias spawn_ball() remains supported.'],
  },
  rollers: {
    title: 'Switch to the wheel base', summary: 'Loads the wheel-base model and its locomotion policy in the official simulator.', parameters: ['No parameters'],
    notes: ['Model switching is asynchronous; the next command waits for completion.', 'Hardware requires the wheel base and a compatible policy.'],
  },
  legs: {
    title: 'Switch to the leg base', summary: 'Loads the leg model and walk policy in the official simulator.', parameters: ['No parameters'],
    notes: ['Model switching is asynchronous; the next command waits for completion.'],
  },
  push: {
    title: 'Apply an external disturbance', summary: 'Uses debugPush to apply linear and angular velocity disturbances for recovery tests.',
    parameters: ['vx / vy / vz: linear disturbance, each clamped to -2.00 to 2.00', 'wx / wy / wz: angular disturbance, each clamped to -8.00 to 8.00'],
    notes: ['This experiment hook does not correspond to a hardware command.', 'Start with small values. reset() restores the scene.'],
  },
  relief: {
    title: 'Toggle uneven terrain', summary: 'Uses setRelief() to morph the flat floor into smooth slopes for locomotion-policy tests.',
    parameters: ['enabled: true or false'], notes: ['This is a simulator debug control.', 'Program completion and reset() do not disable it; call relief(false) explicitly.'],
  },
  sit: {
    title: 'Sit', summary: 'Triggers the official sit-stand policy on the leg base and enters the seated state.', parameters: ['No parameters'],
    notes: ['Available only with the leg base.', 'The transition is non-blocking; wait(1200) allows it to settle.'],
  },
  stand: {
    title: 'Stand', summary: 'Requests a transition from the seated state back to the walk policy.', parameters: ['No parameters'],
    notes: ['The official controller rejects unsafe transitions.'],
  },
  walk: {
    title: 'Restore the walk policy', summary: 'Requests the walk policy, useful after a sit-stand transition.', parameters: ['No parameters'],
    notes: ['The safety gate may ignore the switch while roll, crouch, or recovery owns control.'],
  },
  quack: {
    title: 'Play the quack action', summary: 'Plays the color-specific sound and drives the simulated mouth animation through the official controller.', parameters: ['No parameters'],
    notes: ['Sound and mouth animation are outside the ONNX policy’s 14D action.', 'Hardware needs matching audio assets and mouth runtime support.'],
  },
  camera: {
    title: 'Set camera mode', summary: 'Enables or disables the tracking camera for recording or manual inspection.', parameters: ['mode: "follow" for tracking or "free" for the free camera'],
    notes: ['Camera state does not enter the policy observation.'],
  },
  move: {
    title: 'Load a community or custom motion', summary: 'Loads a manifest through the official loader, validates tensor shapes and outputs, then mounts the motion.',
    parameters: ['ref: "org/repo" or an accessible HTTPS .onnx URL'],
    notes: ['Community motions are published dynamically, so there is no fixed complete list.', 'Supports perpetual gait or sit-stand, episodic trick, and command-script manifests.', 'A direct ONNX URL without a sibling manifest mounts as a perpetual walk policy.', 'The official policy remains active if validation fails.'],
  },
  'play-move': {
    title: 'Play the loaded motion', summary: 'Starts the loaded episodic, script, or sit-stand motion according to its manifest slot. A walk gait becomes active when loaded.',
    parameters: ['No parameters'], notes: ['Call move(ref) first.', 'Calling play_move() again stops a command script timeline.'],
  },
  official: {
    title: 'Restore official policies', summary: 'Unloads the community motion and restores the official walk, sit-stand, and roll policies saved at simulator startup.',
    parameters: ['No parameters'], notes: ['This reversible fallback does not delete Hub or local motion files.'],
  },
};

export const englishObservationGroups = [
  { range: 'obs[0..2]', length: '3D', name: 'Gyroscope angular velocity', detail: 'Body angular velocity on x / y / z' },
  { range: 'obs[3..5]', length: '3D', name: 'Projected gravity', detail: 'Gravity direction in body coordinates; obs[5] is approximately -1 when upright' },
  { range: 'obs[6..19]', length: '14D', name: 'Joint position', detail: 'Position of 14 joints relative to the default pose' },
  { range: 'obs[20..33]', length: '14D', name: 'Joint velocity', detail: 'Velocity of the 14 joints' },
  { range: 'obs[34..47]', length: '14D', name: 'Previous action', detail: 'The 14D action returned by the policy in the previous control cycle' },
  { range: 'obs[48..60]', length: '13D', name: 'Command', detail: '3D velocity + 4D head command + 6D body command currently reserved as zero' },
];
