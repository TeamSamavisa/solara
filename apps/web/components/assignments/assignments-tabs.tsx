"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * The tab shell is the only client part; each panel receives server-rendered
 * content. The active tab lives in the URL so a filter submit inside a panel
 * comes back to the same tab.
 */
export function AssignmentsTabs({
  defaultTab,
  list,
  print,
  optimize,
}: {
  defaultTab: string
  list: React.ReactNode
  print: React.ReactNode
  optimize: React.ReactNode
}) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="list">Listagem</TabsTrigger>
        <TabsTrigger value="optimize">Otimização</TabsTrigger>
        <TabsTrigger value="print">Impressão</TabsTrigger>
      </TabsList>
      <TabsContent value="list">{list}</TabsContent>
      <TabsContent value="optimize">{optimize}</TabsContent>
      <TabsContent value="print">{print}</TabsContent>
    </Tabs>
  )
}
