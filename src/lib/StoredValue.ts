import 'reflect-metadata';
import { jsonArrayMember, jsonMember, jsonObject } from 'typedjson';
import { CLValue, CLType, CLValueParsers, matchTypeToCLType } from './CLValue';
import {
  Bid,
  ValidatorBid,
  VestingSchedule
} from '../services/CasperServiceByJsonRPC';

@jsonObject
class NamedKey {
  @jsonMember({ constructor: String })
  public name: string;
  @jsonMember({ constructor: String })
  public key: string;
}

@jsonObject
class AssociatedKey {
  @jsonMember({ name: 'account_hash', constructor: String })
  public accountHash: string;
  @jsonMember({ constructor: Number })
  public weight: number;
}

@jsonObject
class ActionThresholds {
  @jsonMember({ constructor: Number })
  public deployment: number;

  @jsonMember({ name: 'key_management', constructor: Number })
  public keyManagement: number;
}

/**
 * Structure representing a user's account, stored in global state.
 */
@jsonObject
class AccountJson {
  public accountHash(): string {
    return this._accountHash;
  }

  @jsonMember({ name: 'account_hash', constructor: String })
  private _accountHash: string;
  @jsonArrayMember(NamedKey, { name: 'named_keys' })
  public namedKeys: NamedKey[];
  @jsonMember({ name: 'main_purse', constructor: String })
  public mainPurse: string;
  @jsonArrayMember(AssociatedKey, { name: 'associated_keys' })
  public associatedKeys: AssociatedKey[];
  @jsonMember({ name: 'action_thresholds', constructor: ActionThresholds })
  public actionThresholds: ActionThresholds;
}

@jsonObject
export class TransferJson {
  // Deploy that created the transfer
  @jsonMember({ name: 'deploy_hash', constructor: String })
  public deployHash: string;

  // Account from which transfer was executed
  @jsonMember({ constructor: String })
  public from: string;

  // Target account hash
  @jsonMember({ constructor: String })
  public to: string;

  // Source purse
  @jsonMember({ constructor: String })
  public source: string;

  // Target purse
  @jsonMember({ constructor: String })
  public target: string;

  // Transfer amount
  @jsonMember({ constructor: String })
  public amount: string;

  // Gas
  @jsonMember({ constructor: String })
  public gas: string;

  // User-defined id
  @jsonMember({ constructor: Number, preserveNull: true })
  public id: number | null;
}

@jsonObject
export class DeployInfoJson {
  // The relevant Deploy.
  @jsonMember({ name: 'deploy_hash', constructor: String })
  public deployHash: string;

  // Transfers performed by the Deploy.
  @jsonArrayMember(String)
  public transfers: string[];

  // Account identifier of the creator of the Deploy.
  @jsonMember({ constructor: String })
  public from: string;
  // Source purse used for payment of the Deploy.
  @jsonMember({ constructor: String })
  public source: string;

  // Gas cost of executing the Deploy.
  @jsonMember({ constructor: String })
  public gas: string;
}

/**
 * Info about a seigniorage allocation for a validator
 */
@jsonObject
class Validator {
  // Validator's public key
  @jsonMember({ name: 'validator_public_key', constructor: String })
  public validatorPublicKey: string;

  // Allocated amount
  @jsonMember({ constructor: String })
  public amount: string;
}

/**
 * Data for Bridge variant of BidKind
 */
@jsonObject
export class Bridge {
  @jsonMember({ name: 'old_validator_public_key', constructor: String })
  old_validator_public_key: string;

  @jsonMember({ name: 'new_validator_public_key', constructor: String })
  new_validator_public_key: string;

  @jsonMember({ name: 'era_id', constructor: Number })
  era_id: number;
}

/**
 * Info about a delegator for bid kind
 */
@jsonObject
export class BidKindDelegator {
  @jsonMember({ name: 'delegator_public_key', constructor: String })
  public delegatorPublicKey: string;

  @jsonMember({ name: 'staked_amount', constructor: String })
  public stakedAmount: string;

  @jsonMember({ name: 'bonding_purse', constructor: String })
  public bondingPurse: string;

  @jsonMember({ name: 'validator_public_key', constructor: String })
  public validatorPublicKey: string;

  @jsonMember({
    name: 'vesting_schedule',
    deserializer: json => {
      //TODO this is very sub-optimal, but typedjson doesn't work with interface-defined json deserialization by default.
      // We would have to copy the whole Bid structrure tree into a class to make it work out of the box
      if (!json) return;
      const str = JSON.stringify(json);
      const bid: VestingSchedule = JSON.parse(str);
      return bid;
    },
    serializer: value => {
      if (!value) return;
      return value;
    }
  })
  public vestingSchedule?: VestingSchedule;
}

/**
 * Info about a seigniorage allocation for a delegator
 */
@jsonObject
class Delegator {
  // Delegator's public key
  @jsonMember({ name: 'delegator_public_key', constructor: String })
  public delegatorPublicKey: string;

  // Validator's public key
  @jsonMember({ name: 'validator_public_key', constructor: String })
  public validatorPublicKey: string;

  // Allocated amount
  @jsonMember({ constructor: String })
  public amount: string;
}

/**
 * Information about a seigniorage allocation
 */
@jsonObject
export class SeigniorageAllocation {
  @jsonMember({ constructor: Validator })
  public Validator?: Validator;

  @jsonMember({ constructor: Delegator })
  public Delegator?: Delegator;
}

/**
 * Auction metadata. Intended to be recorded at each era.
 */
@jsonObject
export class EraInfoJson {
  @jsonArrayMember(SeigniorageAllocation, { name: 'seigniorage_allocations' })
  public seigniorageAllocations: SeigniorageAllocation[];
}

/**
 * enum of supported contract types
 * @enum
 */
export enum SystemEntityType {
  /// Mint contract.
  Mint = 'Mint',
  /// Handle Payment contract.
  HandlePayment = 'HandlePayment',
  /// Standard Payment contract.
  StandardPayment = 'StandardPayment',
  /// Auction contract.
  Auction = 'Auction'
}

export enum TransactionRuntime {
  VmCasperV1 = 'VmCasperV1',
  VmCasperV2 = 'VmCasperV2'
}

@jsonObject
export class EntityKind {
  @jsonMember({ constructor: String })
  System?: SystemEntityType;
  @jsonMember({ constructor: String })
  Account?: string;
  @jsonMember({ constructor: String })
  SmartContract?: TransactionRuntime;
}

@jsonObject
export class AddressableEntityAssociatedKeyJson {
  @jsonMember({ name: 'account_hash', constructor: String })
  public accountHash: string;
  @jsonMember({ name: 'weight', constructor: Number })
  public weight: number;
}

@jsonObject
export class ActionThresholdsJson {
  @jsonMember({ name: 'deployment', constructor: Number })
  public deployment: number;
  @jsonMember({ name: 'upgrade_management', constructor: Number })
  public upgradeManagement: number;
  @jsonMember({ name: 'key_management', constructor: Number })
  public keyManagement: number;
}

@jsonObject
export class MessageTopicJson {
  @jsonMember({ name: 'topic_name', constructor: String })
  public topic_name: string;
  @jsonMember({ name: 'topic_name_hash', constructor: String })
  public topicNameHash: string;
}

/**
 * An AddressableEntity value.
 */
@jsonObject
export class AddressableEntityJson {
  @jsonMember({ name: 'protocol_version', constructor: String })
  public protocolVersion: string;

  @jsonMember({ name: 'entity_kind', constructor: EntityKind })
  public entityKind: EntityKind;

  @jsonMember({ name: 'package_hash', constructor: String })
  public packageHash: string;

  @jsonMember({ name: 'byte_code_hash', constructor: String })
  public byteCodeHash: string;

  @jsonMember({ name: 'main_purse', constructor: String })
  public main_purse: string;

  @jsonArrayMember(AddressableEntityAssociatedKeyJson, {
    name: 'associated_keys'
  })
  public associatedKeys: AddressableEntityAssociatedKeyJson[];

  @jsonMember({ name: 'action_thresholds', constructor: ActionThresholdsJson })
  public actionThresholds: ActionThresholdsJson;

  @jsonArrayMember(MessageTopicJson, { name: 'message_topics' })
  public messageTopics: MessageTopicJson[];
}

/**
 * A NamedKey value.
 */
@jsonObject
export class NamedKeyJson {
  @jsonMember({
    name: 'named_key',
    deserializer: json => {
      if (!json) return;
      return CLValueParsers.fromJSON(json).unwrap();
    },
    serializer: value => {
      if (!value) return;
      return CLValueParsers.toJSON(value).unwrap();
    }
  })
  namedKey: CLValue;

  @jsonMember({
    deserializer: json => {
      if (!json) return;
      return CLValueParsers.fromJSON(json).unwrap();
    },
    serializer: value => {
      if (!value) return;
      return CLValueParsers.toJSON(value).unwrap();
    }
  })
  name: CLValue;
}

/**
 * Named CLType arguments
 */
@jsonObject
export class NamedCLTypeArg {
  @jsonMember({ constructor: String })
  public name: string;

  @jsonMember({
    name: 'cl_type',
    deserializer: json => matchTypeToCLType(json)
  })
  public clType: CLType;
}

/**
 * Entry point metadata
 */
@jsonObject
export class EntryPoint {
  @jsonMember({
    name: 'access',
    deserializer: json => {
      if (typeof json === 'string') return json;
      // TODO: add support for object access
      return null;
    }
  })
  public access: string;

  @jsonMember({ name: 'entry_point_type', constructor: String })
  public entryPointType: string;

  @jsonMember({ constructor: String })
  public name: string;

  @jsonMember({
    name: 'ret',
    deserializer: json => matchTypeToCLType(json)
  })
  public ret: string;

  @jsonArrayMember(NamedCLTypeArg)
  public args: NamedCLTypeArg[];
}

/**
 * Contract metadata.
 */
@jsonObject
export class ContractMetadataJson {
  @jsonMember({ name: 'contract_package_hash', constructor: String })
  public contractPackageHash: string;

  @jsonMember({ name: 'contract_wasm_hash', constructor: String })
  public contractWasmHash: string;

  @jsonArrayMember(EntryPoint, { name: 'entry_points' })
  public entrypoints: EntryPoint[];

  @jsonMember({ name: 'protocol_version', constructor: String })
  public protocolVersion: string;

  @jsonArrayMember(NamedKey, { name: 'named_keys' })
  public namedKeys: NamedKey[];
}

/**
 * Contract Version.
 */
@jsonObject
export class ContractVersionJson {
  @jsonMember({ name: 'protocol_version_major', constructor: Number })
  public protocolVersionMajor: number;

  @jsonMember({ name: 'contract_version', constructor: Number })
  public contractVersion: number;

  @jsonMember({ name: 'contract_hash', constructor: String })
  public contractHash: string;
}

/**
 * Disabled Version.
 */
@jsonObject
export class DisabledVersionJson {
  @jsonMember({ name: 'protocol_version_major', constructor: Number })
  public accessKey: number;

  @jsonMember({ name: 'contract_version', constructor: Number })
  public contractVersion: number;
}

/**
 * Groups.
 */
@jsonObject
export class GroupsJson {
  @jsonMember({ name: 'group', constructor: String })
  public group: string;

  @jsonArrayMember(String, { name: 'keys' })
  public keys: string[];
}

/**
 * Contract Package.
 */
@jsonObject
export class ContractPackageJson {
  @jsonMember({ name: 'access_key', constructor: String })
  public accessKey: string;

  @jsonArrayMember(ContractVersionJson, { name: 'versions' })
  public versions: ContractVersionJson[];

  @jsonArrayMember(DisabledVersionJson, { name: 'disabled_versions' })
  public disabledVersions: DisabledVersionJson[];

  @jsonArrayMember(GroupsJson, { name: 'groups' })
  public groups: GroupsJson[];
}
@jsonObject
export class EntityVersionKey {
  @jsonMember({ name: 'protocol_version_major', constructor: Number })
  protocolVersionMajor: number;
  @jsonMember({ name: 'entity_version', constructor: Number })
  entityVersion: number;
}

@jsonObject
export class EntityVersionEntry {
  @jsonMember({ name: 'entity_version_key', constructor: EntityVersionKey })
  entityVersionKey: EntityVersionKey;

  @jsonMember({ name: 'addressable_entity_hash', constructor: String })
  addressableEntityHash: string;
}

@jsonObject
export class Group {
  @jsonMember({ name: 'group_name', constructor: String })
  groupName: string;

  @jsonArrayMember(String, { name: 'group_users' })
  groupUsers: string[];
}

export enum PackageStatus {
  Locked = 'Locked',
  Unlocked = 'Unlocked'
}

@jsonObject
export class PackageJson {
  @jsonArrayMember(EntityVersionEntry)
  public versions: EntityVersionEntry[];

  @jsonArrayMember(EntityVersionKey, { name: 'disabled_versions' })
  public disabled_versions: EntityVersionKey[];

  @jsonArrayMember(Group)
  public groups: Group[];

  @jsonMember({ name: 'lock_status', constructor: String })
  public lockStatus: PackageStatus;
}

@jsonObject
export class BidKindJson {
  @jsonMember({
    deserializer: json => {
      //TODO this is very sub-optimal, but typedjson doesn't work with interface-defined json deserialization by default.
      // We would have to copy the whole Bid structrure tree into a class to make it work out of the box
      if (!json) return;
      const str = JSON.stringify(json);
      const bid: Bid = JSON.parse(str);
      return bid;
    },
    serializer: value => {
      if (!value) return;
      return value;
    }
  })
  public Unified?: Bid;

  @jsonMember({
    deserializer: json => {
      //TODO this is very sub-optimal, but typedjson doesn't work with interface-defined json deserialization by default.
      // We would have to copy the whole Bid structrure tree into a class to make it work out of the box
      if (!json) return;
      const str = JSON.stringify(json);
      const bid: ValidatorBid = JSON.parse(str);
      return bid;
    },
    serializer: value => {
      if (!value) return;
      return value;
    }
  })
  Validator?: ValidatorBid;

  @jsonMember({ constructor: BidKindDelegator })
  Delegator?: BidKindDelegator;

  @jsonMember({ constructor: Bridge })
  Bridge?: Bridge;
}

@jsonObject
export class StoredValue {
  @jsonMember({
    deserializer: json => {
      if (!json) return;
      return CLValueParsers.fromJSON(json).unwrap();
    },
    serializer: value => {
      if (!value) return;
      return CLValueParsers.toJSON(value).unwrap();
    }
  })
  public CLValue?: CLValue;

  // An account
  @jsonMember({ constructor: AccountJson })
  public Account?: AccountJson;

  // A contract's Wasm
  @jsonMember({ constructor: String })
  public ContractWASM?: string;

  // Methods and type signatures supported by a contract
  @jsonMember({ constructor: ContractMetadataJson })
  public Contract?: ContractMetadataJson;

  // A contract definition, metadata, and security container
  @jsonMember({ constructor: ContractPackageJson })
  public ContractPackage?: ContractPackageJson;

  // A record of a transfer
  @jsonMember({ constructor: TransferJson })
  public Transfer?: TransferJson;

  // A record of a deploy
  @jsonMember({ constructor: DeployInfoJson })
  public DeployInfo?: DeployInfoJson;

  @jsonMember({ constructor: EraInfoJson })
  public EraInfo?: EraInfoJson;

  @jsonMember({ constructor: NamedKeyJson })
  public NamedKey?: NamedKeyJson;

  @jsonMember({ constructor: AddressableEntityJson })
  public AddressableEntity?: AddressableEntityJson;

  @jsonMember({ constructor: BidKindJson })
  public BidKind?: BidKindJson;

  @jsonMember({ constructor: PackageJson })
  public Package?: PackageJson;
}
