export function createEmptyContainers() {
return {
board: [],
stackTop: [],
stackBottom: [],
pocketLeft: []
};
}

export function getMachineContainer(
machineContainers,
machineId
) {
const id = String(machineId);

for (const [containerKey, ids] of Object.entries(machineContainers)) {
if ((ids || []).includes(id)) {
return containerKey;
}
}

return "board";
}

export function moveMachineToContainer(
machineContainers,
machineId,
targetContainer
) {
if (!machineId || !targetContainer) {
return machineContainers;
}

const id = String(machineId);

const next = {};

Object.keys(machineContainers).forEach(containerKey => {
next[containerKey] = (
machineContainers[containerKey] || []
).filter(item => String(item) !== id);
});

next[targetContainer] = [
...(next[targetContainer] || []),
id
];

return next;
}

export function moveMachineWithinContainer(
machineContainers,
containerKey,
dragId,
targetId,
insertAfter = false
) {
if (
!containerKey ||
!dragId ||
!targetId ||
dragId === targetId
) {
return machineContainers;
}

const source =
machineContainers[containerKey] || [];

const fromIndex = source.findIndex(
item => String(item) === String(dragId)
);

const toIndex = source.findIndex(
item => String(item) === String(targetId)
);

if (fromIndex === -1 || toIndex === -1) {
return machineContainers;
}

const nextContainer = [...source];

const [moved] =
nextContainer.splice(fromIndex, 1);

const adjustedTargetIndex =
nextContainer.findIndex(
item => String(item) === String(targetId)
);

const insertIndex =
insertAfter
? adjustedTargetIndex + 1
: adjustedTargetIndex;

nextContainer.splice(
insertIndex,
0,
moved
);

return {
...machineContainers,
[containerKey]: nextContainer
};
}

export function moveMachineBackToBoard(
machineContainers,
machineId
) {
return moveMachineToContainer(
machineContainers,
machineId,
"board"
);
}
