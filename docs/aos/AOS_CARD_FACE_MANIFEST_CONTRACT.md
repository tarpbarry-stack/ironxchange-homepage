# IXI AOS Card / Face Manifest Contract

## System truth

The permanent IXI Object is truth. A Card or Face never creates a parallel factual record for that Object.

## Factual Face data

A Face may obtain factual Object information from exactly two source classes:

1. `permissioned-user-field` — customer-defined values maintained by a permissioned user.
2. `transact` — authorized TRAN$ACT records/projections attached to the Object.

Customer freedom is preserved: customers may define, add, edit, remove and rearrange the fields they choose to capture, subject to authorization. This remains source class #2 above and does not create a new source category.

## Context is not a third factual source

Relationships, containment, media, definitions, labels, Card geometry, Face geometry, permissions, capabilities, aggregates and system presentation metadata may be supplied to Cards/Faces as context/configuration. They do not become independent factual Face-data origins.

## Card library doctrine

Cards 001–017 keep their existing geometry and interaction contracts. This manifest feeds them; it does not redesign them.

Card 007 `$ TRAN$ACT` remains an Object-scoped launcher into TRAN$ACT. TRAN$ACT records created there can return as authorized projections for Faces.

Card 009 and other customer Faces may display/edit any authorized customer-defined fields and may display authorized TRAN$ACT projections. The Object identity remains unchanged.

## Identity

Every production manifest is scoped by permanent `objectId` and, where available, `passportId`. Display names, field labels, Card numbers and Face labels are not identity keys.

## Failure behavior

An unauthorized manifest fails closed. A Face App requesting factual `dataCapabilities` outside the two-source contract fails authorization. Context capabilities may still be required/optional for rendering or behavior, but they are not factual data capabilities.
