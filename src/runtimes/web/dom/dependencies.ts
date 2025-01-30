import { ScriptReceiverFactory } from './script_receiver_factory';
import Defaults from 'core/defaults';
import DependencyLoader from './dependency_loader';

export var DependenciesReceivers = new ScriptReceiverFactory(
  '_pusher_dependencies',
  'Pusher.DependenciesReceivers',
);

export var Dependencies = new DependencyLoader({
  cdn_http: Defaults.cdn_http,
  cdn_https: Defaults.cdn_https,
  version: Defaults.VERSION,
  suffix: Defaults.dependency_suffix,
  receivers: DependenciesReceivers,
});
