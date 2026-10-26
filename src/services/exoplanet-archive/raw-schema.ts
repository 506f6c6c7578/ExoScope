import * as z from "zod/mini";
import type { ArchiveColumn } from "@/services/exoplanet-archive/query";
import { printableTextSchema } from "@/lib/validation/text";

const optionalNumber = z.nullable(z.number());
const limitFlag = z.nullable(z.union([z.literal(-1), z.literal(0), z.literal(1)]));
const optionalText = (maxLength: number) => z.nullable(z.string().check(z.maxLength(maxLength)));

export const archiveRowSchema = z.object({
    pl_name: printableTextSchema(120),
    hostname: optionalText(400),
    sy_pnum: z.nullable(z.int()),
    discoverymethod: optionalText(80),
    disc_year: z.nullable(z.int()),
    disc_facility: optionalText(400),
    sy_dist: optionalNumber,
    pl_bmassj: optionalNumber,
    pl_bmassjlim: limitFlag,
    pl_bmassprov: optionalText(40),
    pl_bmassj_reflink: optionalText(2000),
    pl_radj: optionalNumber,
    pl_radjlim: limitFlag,
    pl_radj_reflink: optionalText(2000),
    pl_orbper: optionalNumber,
    pl_orbperlim: limitFlag,
    pl_orbper_reflink: optionalText(2000),
    pl_orbsmax: optionalNumber,
    pl_orbsmaxlim: limitFlag,
    pl_orbsmax_reflink: optionalText(2000),
    pl_orbeccen: optionalNumber,
    pl_orbeccenlim: limitFlag,
    pl_orbeccen_reflink: optionalText(2000),
    pl_eqt: optionalNumber,
    pl_eqtlim: limitFlag,
    pl_eqt_reflink: optionalText(2000),
    st_teff: optionalNumber,
    st_rad: optionalNumber,
    ra: optionalNumber,
    dec: optionalNumber,
    pl_controv_flag: z.nullable(z.union([z.literal(0), z.literal(1)]))
} satisfies Record<ArchiveColumn, z.ZodMiniType>);

export type ArchiveRow = z.infer<typeof archiveRowSchema>;

export const archiveResponseSchema = z.array(z.unknown());
