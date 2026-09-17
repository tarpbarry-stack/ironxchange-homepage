import test from 'node:test';
import assert from 'node:assert/strict';
import {readRailOrder,orderedRailIds,moveRailItem,railStorageKey} from '../components/ixi-sales-desk/railOrder.mjs';

test('drag moves one machine in either direction and survives JSON restoration',()=>{
  const ids=['a','b','c','d'];
  const moved=moveRailItem([],ids,ids,'a','c');
  assert.deepEqual(moved,['b','c','a','d']);
  assert.deepEqual(orderedRailIds(readRailOrder(JSON.parse(JSON.stringify(moved))),ids),moved);
  assert.deepEqual(moveRailItem(moved,ids,moved,'d','b'),['d','b','c','a']);
});
test('filtered drag preserves hidden and not yet loaded contact positions',()=>{
  const saved=['a','hidden','b','unloaded','c'];
  const moved=moveRailItem(saved,['a','b','c'],['a','c'],'c','a');
  assert.deepEqual(moved,['c','hidden','b','unloaded','a']);
  assert.deepEqual(orderedRailIds(moved,['a','b','c']),['c','b','a']);
  assert.deepEqual(orderedRailIds(moved,['a','hidden','b','unloaded','c','new']),[...moved,'new']);
});
test('cancel, unknown target and empty contacts do not change order',()=>{
  const saved=['a','b'];
  assert.equal(moveRailItem(saved,saved,saved,'a','missing'),saved);
  assert.equal(moveRailItem(saved,saved,saved,'a','a'),saved);
  assert.deepEqual(orderedRailIds(saved,[]),[]);
  assert.deepEqual(readRailOrder({}),[]);
  assert.deepEqual(readRailOrder(['a','a',null,1,'','b']),['a','b']);
});
test('personal rail keys separate users, companies and sources',()=>{
  const actor={entityId:'company',actorId:'user'};
  const keys=[railStorageKey(actor,'owned'),railStorageKey(actor,'related'),railStorageKey(actor,'contacts'),railStorageKey({...actor,actorId:'other'},'owned'),railStorageKey({...actor,entityId:'other'},'owned')];
  assert.equal(new Set(keys).size,5);
  assert.equal(railStorageKey({},'owned'),'');
});
