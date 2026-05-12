// Manually populated importMap.
// Normally Payload generates this via `payload generate:importmap`, but on
// Node 22 that command throws ERR_REQUIRE_ASYNC_MODULE. Until that is fixed
// upstream, every component referenced by the admin UI - both ours and
// third-party - must be listed here by hand.

// ---- Project components ---------------------------------------------------
import ViewSiteLink_default from '@/components/admin/ViewSiteLink'
import LogoutButton_default from '@/components/admin/LogoutButton'

// ---- Lexical RSC entries (server-side editor wrappers) -------------------
import {
  RscEntryLexicalCell as RscEntryLexicalCell_44fe,
  RscEntryLexicalField as RscEntryLexicalField_44fe,
  LexicalDiffComponent as LexicalDiffComponent_44fe,
} from '@payloadcms/richtext-lexical/rsc'

// ---- Lexical client features (toolbar/buttons/UI) -----------------------
import {
  AlignFeatureClient,
  BlockquoteFeatureClient,
  BlocksFeatureClient,
  BoldFeatureClient,
  ChecklistFeatureClient,
  FixedToolbarFeatureClient,
  HeadingFeatureClient,
  HorizontalRuleFeatureClient,
  IndentFeatureClient,
  InlineCodeFeatureClient,
  InlineToolbarFeatureClient,
  ItalicFeatureClient,
  LinkFeatureClient,
  OrderedListFeatureClient,
  ParagraphFeatureClient,
  RelationshipFeatureClient,
  StrikethroughFeatureClient,
  SubscriptFeatureClient,
  SuperscriptFeatureClient,
  TableFeatureClient,
  UnderlineFeatureClient,
  UnorderedListFeatureClient,
  UploadFeatureClient,
} from '@payloadcms/richtext-lexical/client'

export const importMap = {
  // Project
  '@/components/admin/ViewSiteLink#default': ViewSiteLink_default,
  '@/components/admin/LogoutButton#default': LogoutButton_default,

  // Lexical RSC
  '@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell': RscEntryLexicalCell_44fe,
  '@payloadcms/richtext-lexical/rsc#RscEntryLexicalField': RscEntryLexicalField_44fe,
  '@payloadcms/richtext-lexical/rsc#LexicalDiffComponent': LexicalDiffComponent_44fe,

  // Lexical client features
  '@payloadcms/richtext-lexical/client#AlignFeatureClient': AlignFeatureClient,
  '@payloadcms/richtext-lexical/client#BlockquoteFeatureClient': BlockquoteFeatureClient,
  '@payloadcms/richtext-lexical/client#BlocksFeatureClient': BlocksFeatureClient,
  '@payloadcms/richtext-lexical/client#BoldFeatureClient': BoldFeatureClient,
  '@payloadcms/richtext-lexical/client#ChecklistFeatureClient': ChecklistFeatureClient,
  '@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient': FixedToolbarFeatureClient,
  '@payloadcms/richtext-lexical/client#HeadingFeatureClient': HeadingFeatureClient,
  '@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient': HorizontalRuleFeatureClient,
  '@payloadcms/richtext-lexical/client#IndentFeatureClient': IndentFeatureClient,
  '@payloadcms/richtext-lexical/client#InlineCodeFeatureClient': InlineCodeFeatureClient,
  '@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient': InlineToolbarFeatureClient,
  '@payloadcms/richtext-lexical/client#ItalicFeatureClient': ItalicFeatureClient,
  '@payloadcms/richtext-lexical/client#LinkFeatureClient': LinkFeatureClient,
  '@payloadcms/richtext-lexical/client#OrderedListFeatureClient': OrderedListFeatureClient,
  '@payloadcms/richtext-lexical/client#ParagraphFeatureClient': ParagraphFeatureClient,
  '@payloadcms/richtext-lexical/client#RelationshipFeatureClient': RelationshipFeatureClient,
  '@payloadcms/richtext-lexical/client#StrikethroughFeatureClient': StrikethroughFeatureClient,
  '@payloadcms/richtext-lexical/client#SubscriptFeatureClient': SubscriptFeatureClient,
  '@payloadcms/richtext-lexical/client#SuperscriptFeatureClient': SuperscriptFeatureClient,
  '@payloadcms/richtext-lexical/client#TableFeatureClient': TableFeatureClient,
  '@payloadcms/richtext-lexical/client#UnderlineFeatureClient': UnderlineFeatureClient,
  '@payloadcms/richtext-lexical/client#UnorderedListFeatureClient': UnorderedListFeatureClient,
  '@payloadcms/richtext-lexical/client#UploadFeatureClient': UploadFeatureClient,
}
