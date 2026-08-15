const clean=v=>String(v??"").trim();
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};

export function createIXITransactContext({object={},actor={},entity={},activeWorkOrder=null,permissions=[]}={}){
  const source=obj(object),fields=obj(source.fields),passport=clean(source.passportId||source.ixiPassportId||source.passport?.passportId||source.passport?.id);
  return {
    schema:"ixi-transact-context-v1",
    launchedAt:new Date().toISOString(),
    source:"aos-object-toolbar-dollar",
    primary:{passportId:passport,objectId:clean(source.objectId||source.id),objectType:clean(source.objectType||source.type||source.templateType),label:clean(source.displayName||source.name||source.title)||"AOS OBJECT"},
    entity:{passportId:clean(entity.passportId||source.entityPassportId||fields.entityPassportId),label:clean(entity.displayName||entity.name||source.entityName)},
    location:{passportId:clean(fields.locationPassportId||source.locationPassportId),label:clean(fields.location||source.location)},
    actor:{passportId:clean(actor.passportId||actor.ixiPassportId),userId:clean(actor.userId||actor.id),employeeId:clean(actor.employeeId),label:clean(actor.displayName||actor.name)},
    activeWorkOrder:activeWorkOrder?{...obj(activeWorkOrder)}:null,
    permissions:Array.isArray(permissions)?permissions:[],
    references:[passport?{passportId:passport,role:clean(source.objectType||source.type||"object").toLowerCase(),label:clean(source.displayName||source.name||source.title)}:null].filter(Boolean)
  };
}

export default {createIXITransactContext};
