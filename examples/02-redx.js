const { moduleBuilder } = require("../lib/builder");

let obj = createObject();
let b = moduleBuilder(obj.rootSlot);

let requestedUri = b.exportValue("string", ["Inputs", "requestedUri"]),
	triggerSlot = b.exportReference("Slot", ["Inputs", "triggerSlot"]),
	provider = b.exportReference("IAssetProvider<Animation>", ["Outputs", "provider"]);

let providerA = b.component("StaticAnimationProvider"),
	providerB = b.component("StaticAnimationProvider");
b.component("AssetLoader<Animation>").assign("Asset", providerA);
b.component("AssetLoader<Animation>").assign("Asset", providerB);

let cacheBuster = b.component("ValueRegister<int>");
let bustedUri = requestedUri.add("&v=", cacheBuster).ifElse(requestedUri.contains("?"), requestedUri.add("?v=", cacheBuster));

let activeProviderIndex = b.component("ValueRegister<int>");
let activeProvider = b.multiplexer("IAssetProvider<Animation>", [providerA, providerB], activeProviderIndex),
	inactiveProvider = b.multiplexer("IAssetProvider<Animation>", [providerB, providerA], activeProviderIndex);

provider.assign(activeProvider);

requestedUri.fireOnChange([
	cacheBuster.inc(),
	inactiveProvider.get("Uri").write(bustedUri)
], obj.rootSlot.allocatingUser());

let animation = inactiveProvider.getAsset();
animation.sampleAnimationTrack("int", animation.findAnimationTrackIndex("_meta", "v"), 1).eq(cacheBuster).fireOnTrue([
	activeProviderIndex.write(activeProviderIndex.oneMinus()),
	triggerSlot.triggerDynamicImpulse("OnRequestDone", true)
]);
